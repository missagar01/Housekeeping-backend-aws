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

class AssignTaskRepository {
  constructor() {
    this.records = [];
    this.nextId = 1;
  }

  async findAll() {
    if (useMemory) return this.records;
    const result = await query(
      'SELECT * FROM assign_task ORDER BY id ASC'
    );
    return result.rows.map(applyComputedDelay);
  }

  async findById(id) {
    if (useMemory) {
      return this.records.find((r) => String(r.id) === String(id));
    }
    const result = await query('SELECT * FROM assign_task WHERE id = $1', [id]);
    return applyComputedDelay(result.rows[0]);
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

    const sql = `
      INSERT INTO assign_task (
        id, task_id, department, given_by, name, task_description, remark, status,
        image, attachment, frequency, task_start_date, submission_date,
        delay, remainder, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING id, task_id, department, given_by, name, task_description, remark, status,
        image, attachment, frequency, task_start_date, submission_date,
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
