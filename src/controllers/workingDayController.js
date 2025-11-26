const { workingDayRepository } = require('../repositories/workingDayRepository');

const workingDayController = {
  async list(_req, res, next) {
    try {
      const days = await workingDayRepository.findAll();
      res.json(days);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { workingDayController };
