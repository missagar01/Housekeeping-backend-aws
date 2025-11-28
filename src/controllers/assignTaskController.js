const { assignTaskService } = require('../services/assignTaskService');
const { ApiError } = require('../middleware/errorHandler');
const { notifyAssignmentUpdate } = require('../services/whatsappService');
const { logger } = require('../utils/logger');

const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly', 'one-time'];

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

  async list(_req, res, next) {
    try {
      const items = await assignTaskService.list();
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

  async overdue(_req, res, next) {
    try {
      const items = await assignTaskService.overdue();
      res.json(items);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { assignTaskController };
