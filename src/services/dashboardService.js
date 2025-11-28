const { assignTaskService } = require('./assignTaskService');

const isOnOrBeforeToday = (dateStr) => {
  if (!dateStr) return true; // include tasks without a start date
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true; // include if invalid date stored
  const today = new Date();
  today.setHours(23, 59, 59, 999); // end of today
  return d <= today;
};

class DashboardService {
  async summary() {
    const items = await assignTaskService.list();
    const active = items.filter((task) => isOnOrBeforeToday(task.task_start_date));
    return assignTaskService.stats(items, active);
  }
}

const dashboardService = new DashboardService();

module.exports = { dashboardService };
