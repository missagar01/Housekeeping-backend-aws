const { ApiError } = require('../middleware/errorHandler');
const { userRepository } = require('../repositories/userRepository');

const authController = {
  async login(req, res, next) {
    try {
      const { user_name, password } = req.body;
      const user = await userRepository.findByUsername(user_name);
      if (!user || user.password !== password) {
        throw new ApiError(401, 'Invalid credentials');
      }
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          user_name: user.user_name,
          role: user.role || null
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { authController };
