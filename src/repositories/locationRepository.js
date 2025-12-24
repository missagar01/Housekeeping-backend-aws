const { query } = require('../../config/db');

class LocationRepository {
  async listAll() {
    const result = await query(
      `SELECT location
       FROM locations
       WHERE location IS NOT NULL 
         AND TRIM(location) <> ''
       ORDER BY LOWER(location) ASC`
    );

    return result.rows.map(row => ({
      location: row.location?.trim()
    }));
  }

  async create(input) {
    // only one column: location
    const location = input.location?.trim();

    if (!location) return null;

    const result = await query(
      `INSERT INTO locations (location)
       VALUES ($1)
       RETURNING location`,
      [location]
    );

    return {
      location: result.rows[0].location.trim()
    };
  }
}

module.exports = { locationRepository: new LocationRepository() };
