const { assignTaskRepository } = require('../repositories/assignTaskRepository');
const { workingDayRepository } = require('../repositories/workingDayRepository');

class AssignTaskService {
  create(input) {
    return assignTaskRepository.create(input);
  }

  list() {
    return assignTaskRepository.findAll();
  }

  getById(id) {
    return assignTaskRepository.findById(id);
  }

  async bulkCreate(items) {
    const results = [];
    for (const item of items) {
      // sequential to keep ids/tasks ordered
      // eslint-disable-next-line no-await-in-loop
      const created = await assignTaskRepository.create(item);
      results.push(created);
    }
    return results;
  }

  async generateFromWorkingDays(base) {
    if (!base.task_start_date) {
      throw new Error('task_start_date is required for generation');
    }

    const allRows = await workingDayRepository.findAll();
    if (!allRows || allRows.length === 0) {
      throw new Error('No working days available');
    }

    const toMidnight = (d) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    };

    const startDate = toMidnight(base.task_start_date);
    if (Number.isNaN(startDate.getTime())) {
      throw new Error('Invalid task_start_date');
    }

    // Normalize working days to JS Date array sorted ASC
    const workingDates = allRows
      .map((row) => toMidnight(row.working_date || row))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a - b);

    if (workingDates.length === 0) {
      throw new Error('No working days available');
    }

    const firstWorkingDate = workingDates[0];
    const lastWorkingDate = workingDates[workingDates.length - 1];
    if (startDate > lastWorkingDate) {
      throw new Error('No working days on/after task_start_date');
    }

    // If startDate is before the first working day, begin at the first working day
    const effectiveStart = startDate < firstWorkingDate ? firstWorkingDate : startDate;

    // Helper to add intervals
    const addDays = (d, days) => {
      const next = new Date(d);
      next.setDate(next.getDate() + days);
      next.setHours(0, 0, 0, 0);
      return next;
    };
    const addMonths = (d, months) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + months);
      next.setHours(0, 0, 0, 0);
      return next;
    };
    const addYears = (d, years) => {
      const next = new Date(d);
      next.setFullYear(next.getFullYear() + years);
      next.setHours(0, 0, 0, 0);
      return next;
    };

    // Find first working day >= effectiveStart
    let currentIndex = workingDates.findIndex((d) => d >= effectiveStart);
    if (currentIndex === -1) {
      throw new Error('No working days on/after task_start_date');
    }

    const pickDates = [];
    const freq = (base.frequency || 'daily').toLowerCase();
    const increment = (date) => {
      switch (freq) {
        case 'weekly':
          return addDays(date, 7);
        case 'monthly':
          return addMonths(date, 1);
        case 'yearly':
          return addYears(date, 1);
        case 'daily':
        default:
          return addDays(date, 1);
      }
    };

    // Always include the first working day on/after start
    pickDates.push(workingDates[currentIndex]);

    // Generate until we exceed the last working day
    while (true) {
      const candidate = increment(pickDates[pickDates.length - 1]);
      if (candidate > lastWorkingDate) break;

      // find next working day >= candidate
      const nextIdx = workingDates.findIndex(
        (d, idx) => idx > currentIndex && d >= candidate
      );
      if (nextIdx === -1) break;

      pickDates.push(workingDates[nextIdx]);
      currentIndex = nextIdx;
    }

    const tasks = pickDates.map((d) => ({
      ...base,
      task_start_date: d.toISOString(),
      submission_date: null
    }));

    return this.bulkCreate(tasks);
  }

  update(id, input) {
    return assignTaskRepository.update(id, input);
  }

  remove(id) {
    return assignTaskRepository.delete(id);
  }
}

const assignTaskService = new AssignTaskService();

module.exports = { assignTaskService };
