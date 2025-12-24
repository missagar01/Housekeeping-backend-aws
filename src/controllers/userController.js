const { ApiError } = require('../middleware/errorHandler');
const { userService } = require('../services/userService');

const sanitizeUser = (u) => {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
};

const userController = {
  async create(req, res, next) {
    try {
      const created = await userService.create(req.body);
      res.status(201).json(sanitizeUser(created));
    } catch (err) {
      next(err);
    }
  },

  async list(_req, res, next) {
    try {
      const users = await userService.list();
      res.json(users.map(sanitizeUser));
    } catch (err) {
      next(err);
    }
  },

  async listDepartments(_req, res, next) {
    try {
      const data = await userService.listDepartments();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      if (!user) throw new ApiError(404, 'User not found');
      res.json(sanitizeUser(user));
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await userService.update(req.params.id, req.body);
      if (!updated) throw new ApiError(404, 'User not found');
      res.json(sanitizeUser(updated));
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const removed = await userService.remove(req.params.id);
      if (!removed) throw new ApiError(404, 'User not found');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { userController };

