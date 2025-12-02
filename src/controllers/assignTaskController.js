const { assignTaskService } = require('../services/assignTaskService');
const { ApiError } = require('../middleware/errorHandler');
const { notifyAssignmentUpdate } = require('../services/whatsappService');
const { logger } = require('../utils/logger');

const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly', 'one-time'];
const parsePositiveInt = (value, { max, defaultValue } = {}) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return defaultValue;
  const capped = max ? Math.min(n, max) : n;
  return capped;
};

const normalizeFrequency = (value, { defaultValue } = {}) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const lower = String(value).toLowerCase();
  if (ALLOWED_FREQUENCIES.includes(lower)) return lower;
  return defaultValue !== undefined ? defaultValue : lower;
};

const prepareCreatePayload = (payload = {}) => {
  const frequency = normalizeFrequency(payload.frequency, { defaultValue: 'daily' });
  if (frequency === 'one-time' && !payload.task_start_date) {
    throw new ApiError(400, 'task_start_date is required for one-time frequency');
  }
  return { ...payload, frequency };
};

const prepareUpdatePayload = (payload = {}) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'frequency')) {
    const frequency = normalizeFrequency(payload.frequency, { defaultValue: 'daily' });
    if (frequency === 'one-time' && !payload.task_start_date) {
      throw new ApiError(400, 'task_start_date is required when setting frequency to one-time');
    }
    return { ...payload, frequency };
  }
  return payload;
};

const assignTaskController = {
  async create(req, res, next) {
    try {
      const prepared = prepareCreatePayload(req.body);
      const created = await assignTaskService.create(prepared);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  async bulkCreate(req, res, next) {
    try {
      const body = Array.isArray(req.body) ? req.body : [];
      const prepared = body.map((item) => prepareCreatePayload(item));
      const created = await assignTaskService.bulkCreate(prepared);
      res.status(201).json({ count: created.length, items: created });
    } catch (err) {
      next(err);
    }
  },

  async generateFromWorkingDays(req, res, next) {
    try {
      const created = await assignTaskService.generateFromWorkingDays(req.body || {});
      res.status(201).json({ count: created.length, items: created });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const limit = parsePositiveInt(req.query?.limit, { max: 100, defaultValue: 100 });
      const offset = parsePositiveInt(req.query?.offset, { defaultValue: 0 });
      const page = parsePositiveInt(req.query?.page, { defaultValue: 1 });
      const effectiveOffset = page && limit ? (page - 1) * limit : offset;
      const department = req.query?.department;

      const items = await assignTaskService.list({ limit, offset: effectiveOffset, department });
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await assignTaskService.getById(req.params.id);
      if (!item) throw new ApiError(404, 'Assignment not found');
      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const prepared = prepareUpdatePayload(req.body);
      const updated = await assignTaskService.update(req.params.id, prepared);
      if (!updated) throw new ApiError(404, 'Assignment not found');
      // Fire-and-forget notification; internal errors are logged inside the notifier.
      notifyAssignmentUpdate(updated);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const removed = await assignTaskService.remove(req.params.id);
      if (!removed) throw new ApiError(404, 'Assignment not found');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async stats(_req, res, next) {
    try {
      const snapshot = await assignTaskService.stats();
      res.json(snapshot);
    } catch (err) {
      next(err);
    }
  },

  async overdue(req, res, next) {
    try {
      const limit = parsePositiveInt(req.query?.limit, { max: 100, defaultValue: 100 });
      const offset = parsePositiveInt(req.query?.offset, { defaultValue: 0 });
      const page = parsePositiveInt(req.query?.page, { defaultValue: 1 });
      const effectiveOffset = page && limit ? (page - 1) * limit : offset;
      const department = req.query?.department;

      const items = await assignTaskService.overdue({
        limit,
        offset: effectiveOffset,
        department
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async notDone(_req, res, next) {
    try {
      const department = _req.query?.department;
      const items = await assignTaskService.notDone({ department });
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async today(req, res, next) {
    try {
      const limit = parsePositiveInt(req.query?.limit, { max: 100, defaultValue: 100 });
      const offset = parsePositiveInt(req.query?.offset, { defaultValue: 0 });
      const page = parsePositiveInt(req.query?.page, { defaultValue: 1 });
      const effectiveOffset = page && limit ? (page - 1) * limit : offset;
      const department = req.query?.department;

      const items = await assignTaskService.today({
        limit,
        offset: effectiveOffset,
        department
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async pending(req, res, next) {
    try {
      const limit = parsePositiveInt(req.query?.limit, { max: 100, defaultValue: 100 });
      const offset = parsePositiveInt(req.query?.offset, { defaultValue: 0 });
      const page = parsePositiveInt(req.query?.page, { defaultValue: 1 });
      const effectiveOffset = page && limit ? (page - 1) * limit : offset;
      const department = req.query?.department;

      const items = await assignTaskService.pending({
        limit,
        offset: effectiveOffset,
        department
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async history(req, res, next) {
    try {
      const limit = parsePositiveInt(req.query?.limit, { max: 100, defaultValue: 100 });
      const offset = parsePositiveInt(req.query?.offset, { defaultValue: 0 });
      const page = parsePositiveInt(req.query?.page, { defaultValue: 1 });
      const effectiveOffset = page && limit ? (page - 1) * limit : offset;
      const department = req.query?.department;

      const items = await assignTaskService.history({
        limit,
        offset: effectiveOffset,
        department
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  // Mark an assignment as confirmed (stores marker in attachment column)
  async confirmAttachment(req, res, next) {
    try {
      const attachmentValue = req.body && req.body.attachment
        ? String(req.body.attachment)
        : 'confirmed';
      const updated = await assignTaskService.update(req.params.id, { attachment: attachmentValue });
      if (!updated) throw new ApiError(404, 'Assignment not found');
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { assignTaskController };
