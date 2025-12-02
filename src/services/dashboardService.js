const { assignTaskService } = require('./assignTaskService');

const getEndOfYesterday = () => {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(23, 59, 59, 999);
  return cutoff;
};

class DashboardService {
  async summary() {
    const cutoff = getEndOfYesterday();
    return assignTaskService.aggregateStats(cutoff);
  }
}


const dashboardService = new DashboardService();

module.exports = { dashboardService };
