const { assignTaskService } = require('./assignTaskService');

const isOnOrBeforeCutoff = (dateStr, cutoff) => {
  if (!dateStr) return true; // include tasks without a start date
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true; // include if invalid date stored
  return d <= cutoff;
};

const getEndOfYesterday = () => {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(23, 59, 59, 999);
  return cutoff;
};

class DashboardService {
  async summary() {
    const items = await assignTaskService.list();
    const cutoff = getEndOfYesterday();
    const active = items.filter((task) => isOnOrBeforeCutoff(task.task_start_date, cutoff));
    return assignTaskService.stats(items, active);
  }
}

const dashboardService = new DashboardService();

module.exports = { dashboardService };
