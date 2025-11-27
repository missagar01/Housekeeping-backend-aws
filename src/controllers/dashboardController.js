const { dashboardService } = require('../services/dashboardService');

const dashboardController = {
  async getSummary(_req, res, next) {
    try {
      const data = await dashboardService.summary();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { dashboardController };
