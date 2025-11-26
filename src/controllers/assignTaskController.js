const { assignTaskService } = require('../services/assignTaskService');
const { ApiError } = require('../middleware/errorHandler');

const assignTaskController = {
  async create(req, res, next) {
    try {
      const created = await assignTaskService.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  async bulkCreate(req, res, next) {
    try {
      const created = await assignTaskService.bulkCreate(req.body);
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
      const updated = await assignTaskService.update(req.params.id, req.body);
      if (!updated) throw new ApiError(404, 'Assignment not found');
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
  }
};

module.exports = { assignTaskController };
