const { query } = require('../../config/db');
const { config } = require('../utils/config');

class WorkingDayRepository {
  async findAll() {
    if (config.env === 'test' || !config.pg.host) {
      return [];
    }
    const result = await query(
      `SELECT working_date, day, week_num, month
       FROM working_day_calender
       ORDER BY working_date ASC`
    );
    return result.rows;
  }
}

const workingDayRepository = new WorkingDayRepository();

module.exports = { workingDayRepository };
