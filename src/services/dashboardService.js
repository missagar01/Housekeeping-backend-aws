const { assignTaskService } = require('./assignTaskService');

class DashboardService {
  async summary() {
    return assignTaskService.stats();
  }
}

const dashboardService = new DashboardService();

module.exports = { dashboardService };
