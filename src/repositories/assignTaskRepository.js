const { query } = require('../../config/db');
const { config } = require('../utils/config');

const useMemory = config.env === 'test';

const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly', 'one-time'];
const normalizeFrequency = (value) => {
  const lower = typeof value === 'string' ? value.toLowerCase() : '';
  return ALLOWED_FREQUENCIES.includes(lower) ? lower : 'daily';
};


const computeDelay = (start, submission) => {
  if (!start || !submission) return null;
  const startDate = new Date(start);
  const submissionDate = new Date(submission);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(submissionDate.getTime())) {
    return null;
  }
  const diffDays = Math.floor(
    (submissionDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  return diffDays > 0 ? diffDays : 0;
};

const applyComputedDelay = (record) => {
  if (!record) return record;
  if (record.delay === null || record.delay === undefined) {
    const computed = computeDelay(record.task_start_date, record.submission_date);
    if (computed !== null) return { ...record, delay: computed };
  }
  return record;
};

const serializeHod = (value) => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return value.map((v) => (v === null || v === undefined ? '' : String(v))).join(',');
  }
  return String(value);
};

const normalizeDepartment = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const matchesDepartment = (recordDept, filterDept) => {
  const normalizedFilter = normalizeDepartment(filterDept);
  if (!normalizedFilter) return true;
  return normalizeDepartment(recordDept) === normalizedFilter;
};

class AssignTaskRepository {
  constructor() {
    this.records = [];
    this.nextId = 1;
  }

  async findAll(options = {}) {
    if (useMemory) {
      const { limit, offset, department } = options;
      const start = Number.isInteger(offset) && offset > 0 ? offset : 0;
      const end = Number.isInteger(limit) && limit > 0 ? start + limit : undefined;
      const filtered = this.records
        .filter((r) => matchesDepartment(r.department, department))
        .sort((a, b) => {
          const aDate = new Date(a.task_start_date || 0);
          const bDate = new Date(b.task_start_date || 0);
          const aTs = Number.isNaN(aDate.getTime()) ? 0 : aDate.getTime();
          const bTs = Number.isNaN(bDate.getTime()) ? 0 : bDate.getTime();
          if (aTs !== bTs) return bTs - aTs; // newest first
          return Number(b.id) - Number(a.id);
        });
      return filtered.slice(start, end);
    }

    const params = [];
    const where = [];

    if (options.department) {
      params.push(options.department);
      where.push(`LOWER(department) = LOWER($${params.length})`);
    }

    let sql = 'SELECT * FROM assign_task';
    if (where.length) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }
    sql += ' ORDER BY task_start_date DESC NULLS LAST, id DESC';

    const hasLimit = Number.isInteger(options.limit) && options.limit > 0;
    const hasOffset = Number.isInteger(options.offset) && options.offset > 0;

    if (hasLimit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (hasOffset) {
      if (!hasLimit) sql += ' LIMIT ALL';
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    
    const result = await query(sql, params);
    return result.rows.map(applyComputedDelay);
  }

  async findById(id) {
    if (useMemory) {
      return this.records.find((r) => String(r.id) === String(id));
    }
    const result = await query('SELECT * FROM assign_task WHERE id = $1', [id]);
    return applyComputedDelay(result.rows[0]);
  }

  async findOverdue(cutoff, options = {}) {
    if (useMemory) {
      const endTs = cutoff ? cutoff.getTime() : Number.POSITIVE_INFINITY;
      const filtered = this.records.filter((task) => {
        if (!task || !task.task_start_date) return false;
        const start = new Date(task.task_start_date);
        if (Number.isNaN(start.getTime())) return false;
        if (start > endTs) return false;
        if (!matchesDepartment(task.department, options.department)) return false;
        return !task.submission_date;
      });
      return filtered;
    }

    const params = [cutoff];
    let sql = `
      SELECT *
      FROM assign_task
      WHERE submission_date IS NULL
        AND task_start_date IS NOT NULL
        AND task_start_date <= $1
    `;

    if (options.department) {
      params.push(options.department);
      sql += ` AND LOWER(department) = LOWER($${params.length})`;
    }

    sql += ' ORDER BY task_start_date ASC';

    const result = await query(sql, params);
    return result.rows.map(applyComputedDelay);
  }

  async findPending(cutoff, options = {}) {
    if (useMemory) {
      const cutoffDay = cutoff ? new Date(cutoff) : new Date();
      cutoffDay.setHours(0, 0, 0, 0);
      const filtered = this.records.filter((task) => {
        if (!task || !task.task_start_date) return false;
        const start = new Date(task.task_start_date);
        if (Number.isNaN(start.getTime())) return false;
        start.setHours(0, 0, 0, 0);
        if (start.getTime() > cutoffDay.getTime()) return false;
        if (!matchesDepartment(task.department, options.department)) return false;
        return !task.submission_date;
      }).sort((a, b) => {
        const aDate = new Date(a.task_start_date);
        const bDate = new Date(b.task_start_date);
        const aTs = Number.isNaN(aDate.getTime()) ? 0 : aDate.getTime();
        const bTs = Number.isNaN(bDate.getTime()) ? 0 : bDate.getTime();
        if (aTs !== bTs) return bTs - aTs; // newest first
        return Number(b.id) - Number(a.id);
      });
      return filtered;
    }

    const effectiveCutoff = cutoff || new Date();
    const params = [effectiveCutoff];
    let sql = `
      SELECT *
      FROM assign_task
      WHERE submission_date IS NULL
        AND task_start_date IS NOT NULL
        AND task_start_date::date <= $1::date
    `;

    if (options.department) {
      params.push(options.department);
      sql += ` AND LOWER(department) = LOWER($${params.length})`;
    }

    // Show current/newest dates first for easier review in UI
    sql += ' ORDER BY task_start_date DESC, id DESC';

    const result = await query(sql, params);
    return result.rows.map(applyComputedDelay);
  }

  async findHistory(cutoff, options = {}) {
    if (useMemory) {
      const endTs = cutoff ? cutoff.getTime() : Number.POSITIVE_INFINITY;
      const filtered = this.records.filter((task) => {
        if (!task || !task.task_start_date) return false;
        const start = new Date(task.task_start_date);
        if (Number.isNaN(start.getTime())) return false;
        if (start > endTs) return false;
        if (!matchesDepartment(task.department, options.department)) return false;
        return !!task.submission_date;
      });
      const { limit, offset } = options;
      const startIdx = Number.isInteger(offset) && offset > 0 ? offset : 0;
      const endIdx = Number.isInteger(limit) && limit > 0 ? startIdx + limit : undefined;
      return filtered.slice(startIdx, endIdx);
    }

    const params = [cutoff];
    let sql = `
      SELECT *
      FROM assign_task
      WHERE submission_date IS NOT NULL
        AND task_start_date IS NOT NULL
        AND task_start_date <= $1
    `;

    if (options.department) {
      params.push(options.department);
      sql += ` AND LOWER(department) = LOWER($${params.length})`;
    }

    sql += ' ORDER BY task_start_date DESC';

    const hasLimit = Number.isInteger(options.limit) && options.limit > 0;
    const hasOffset = Number.isInteger(options.offset) && options.offset > 0;

    if (hasLimit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (hasOffset) {
      if (!hasLimit) sql += ' LIMIT ALL';
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows.map(applyComputedDelay);
  }

  async aggregateStats(cutoff) {
    if (useMemory) {
      const all = await this.findAll();
      const cutoffDay = new Date(cutoff);
      cutoffDay.setHours(0, 0, 0, 0);

      const toLower = (v) => (v ? String(v).trim().toLowerCase() : '');
      const completed = all.filter((t) => toLower(t.status) === 'yes').length;
      const notDone = all.filter((t) => toLower(t.status) === 'no').length;

      const active = all.filter((t) => {
        // Only include tasks with start date on/before cutoff
        if (!t.task_start_date) return false;
        const d = new Date(t.task_start_date);
        if (Number.isNaN(d.getTime())) return false;
        d.setHours(0, 0, 0, 0);
        return d.getTime() <= cutoffDay.getTime();
      });

      let overdue = 0;
      let pending = 0;
      active.forEach((t) => {
        if (t.submission_date) return;
        if (!t.task_start_date) {
          pending += 1;
          return;
        }
        const d = new Date(t.task_start_date);
        if (Number.isNaN(d.getTime())) {
          pending += 1;
          return;
        }
        d.setHours(0, 0, 0, 0);
        if (d.getTime() <= cutoffDay.getTime()) {
          overdue += 1;
        } else {
          pending += 1;
        }
      });

      const total = active.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        pending,
        not_done: notDone,
        overdue,
        progress_percent: progress
      };
    }

    // Active tasks: start date on/before cutoff and no submission => overdue; start date after cutoff => pending
    const sql = `
      WITH base AS (
        SELECT
          lower(trim(status)) AS status,
          task_start_date,
          submission_date
        FROM assign_task
        WHERE task_start_date IS NOT NULL
      )
      SELECT
        (SELECT count(*) FROM base WHERE status = 'yes') AS completed,
        (SELECT count(*) FROM base WHERE status = 'no') AS not_done,
        (SELECT count(*) FROM base WHERE submission_date IS NULL AND task_start_date::date <= $1::date) AS overdue,
        (SELECT count(*) FROM base WHERE submission_date IS NULL AND task_start_date::date > $1::date) AS pending,
        (SELECT count(*) FROM base WHERE task_start_date::date <= $1::date) AS total;
    `;

    const result = await query(sql, [cutoff]);
    const row = result.rows[0] || {};
    const total = Number(row.total) || 0;
    const completed = Number(row.completed) || 0;
    const pending = Number(row.pending) || 0;
    const notDone = Number(row.not_done) || 0;
    const overdue = Number(row.overdue) || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      not_done: notDone,
      overdue,
      progress_percent: progress
    };
  }

  async findByDate(targetDate, options = {}) {
    if (useMemory) {
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const filtered = this.records.filter((task) => {
        if (!task || !task.task_start_date) return false;
        const start = new Date(task.task_start_date);
        if (Number.isNaN(start.getTime())) return false;
        if (!matchesDepartment(task.department, options.department)) return false;
        return start >= dayStart && start < dayEnd;
      });

      const { limit, offset } = options;
      const startIdx = Number.isInteger(offset) && offset > 0 ? offset : 0;
      const endIdx = Number.isInteger(limit) && limit > 0 ? startIdx + limit : undefined;
      return filtered.slice(startIdx, endIdx);
    }

    const params = [targetDate];
    let sql = `
      SELECT *
      FROM assign_task
      WHERE task_start_date::date = $1::date
    `;

    if (options.department) {
      params.push(options.department);
      sql += ` AND LOWER(department) = LOWER($${params.length})`;
    }

    sql += ' ORDER BY id ASC';

    const hasLimit = Number.isInteger(options.limit) && options.limit > 0;
    const hasOffset = Number.isInteger(options.offset) && options.offset > 0;

    if (hasLimit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (hasOffset) {
      if (!hasLimit) sql += ' LIMIT ALL';
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows.map(applyComputedDelay);
  }

  async create(input) {
    if (useMemory) {
      return this.createInMemory(input);
    }
    const now = new Date().toISOString();
    const submissionDate = input.submission_date ?? null;

    const seqResult = await query(
      "SELECT nextval(pg_get_serial_sequence('assign_task','id')) AS id"
    );
    const id = seqResult.rows[0].id;
    const taskId = String(id);
    const computedDelay = computeDelay(input.task_start_date, submissionDate);
    const frequency = normalizeFrequency(input.frequency);
    const hod = serializeHod(input.hod);

    const sql = `
      INSERT INTO assign_task (
        id, task_id, department, given_by, name, task_description, remark, status,
        image, attachment, doer_name2, hod, frequency, task_start_date, submission_date,
        delay, remainder, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING id, task_id, department, given_by, name, task_description, remark, status,
        image, attachment, doer_name2, hod, frequency, task_start_date, submission_date,
        delay, remainder, created_at;
    `;

    const params = [
      id,
      taskId,
      input.department,
      input.given_by || null,
      input.name,
      input.task_description,
      input.remark || null,
      input.status || null,
      input.image || null,
      input.attachment || null,
      input.doer_name2 || null,
      hod,
      frequency,
      input.task_start_date || null,
      submissionDate,
      input.delay ?? computedDelay,
      input.remainder || null,
      now
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }

  async update(id, input) {
    if (useMemory) {
      return this.updateInMemory(id, input);
    }

    const existing = await this.findById(id);
    if (!existing) return null;

    const submissionDate = Object.prototype.hasOwnProperty.call(input, 'submission_date')
      ? input.submission_date
      : existing.submission_date;
    const taskStartDate = input.task_start_date ?? existing.task_start_date;
    const computedDelay = computeDelay(taskStartDate, submissionDate);

    const fields = [
      'department',
      'given_by',
      'name',
      'task_description',
      'remark',
      'status',
      'image',
      'attachment',
      'doer_name2',
      'hod',
      'frequency',
      'task_start_date',
      'submission_date',
      'delay',
      'remainder'
    ];

    const setClauses = [];
    const params = [];
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(input, field)) {
        let value = input[field];
        if (field === 'frequency') {
          value = normalizeFrequency(value);
        }
        if (field === 'delay' && computedDelay !== null) {
          value = computedDelay;
        }
        if (field === 'submission_date') {
          value = submissionDate;
        }
        if (field === 'hod') {
          value = serializeHod(value);
        }
        setClauses.push(`${field} = $${params.length + 1}`);
        params.push(value);
      }
    });

    // ensure delay updates when dates change even if delay not explicitly provided
    const datesChanged = Object.prototype.hasOwnProperty.call(input, 'submission_date') ||
      Object.prototype.hasOwnProperty.call(input, 'task_start_date');
    if (!Object.prototype.hasOwnProperty.call(input, 'delay') && computedDelay !== null && datesChanged) {
      setClauses.push(`${'delay'} = $${params.length + 1}`);
      params.push(computedDelay);
    }

    if (setClauses.length === 0) {
      return existing;
    }

    params.push(id);

    const sql = `
      UPDATE assign_task
      SET ${setClauses.join(', ')}
      WHERE id = $${params.length}
      RETURNING *;
    `;

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  async delete(id) {
    if (useMemory) {
      return this.deleteInMemory(id);
    }
    const result = await query('DELETE FROM assign_task WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async createInMemory(input) {
    const now = new Date().toISOString();
    const id = this.nextId++;
    const submissionDate = input.submission_date ?? null;
    const computedDelay = computeDelay(input.task_start_date, submissionDate);
    const frequency = normalizeFrequency(input.frequency);
    const record = {
      id,
      task_id: String(id),
      department: input.department,
      name: input.name,
      task_description: input.task_description,
      given_by: input.given_by || null,
      remark: input.remark || null,
      status: input.status || null,
      image: input.image || null,
      attachment: input.attachment || null,
      doer_name2: input.doer_name2 || null,
      hod: input.hod || null,
      frequency,
      task_start_date: input.task_start_date || null,
      submission_date: submissionDate,
      delay: input.delay ?? computedDelay,
      remainder: input.remainder || null,
      created_at: now
    };
    this.records.push(record);
    return record;
  }

  async updateInMemory(id, input) {
    const idx = this.records.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return null;
    const base = { ...this.records[idx], ...input };
    if (Object.prototype.hasOwnProperty.call(input, 'frequency')) {
      base.frequency = normalizeFrequency(input.frequency);
    }
    const computedDelay = computeDelay(base.task_start_date, base.submission_date);
    if (computedDelay !== null) {
      base.delay = computedDelay;
    }
    if (Object.prototype.hasOwnProperty.call(input, 'hod')) {
      base.hod = serializeHod(input.hod);
    }
    this.records[idx] = base;
    return base;
  }

  async deleteInMemory(id) {
    const before = this.records.length;
    this.records = this.records.filter((r) => String(r.id) !== String(id));
    return this.records.length < before;
  }
}

const assignTaskRepository = new AssignTaskRepository();

module.exports = { assignTaskRepository };
