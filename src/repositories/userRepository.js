const { query } = require('../../config/db');
class UserRepository {
  async findByUsername(userName) {
    const result = await query(
      'SELECT id, user_name, password, role FROM users WHERE user_name = $1 LIMIT 1',
      [userName]
    );
    return result.rows[0] || null;
  }
}

const userRepository = new UserRepository();

module.exports = { userRepository };
