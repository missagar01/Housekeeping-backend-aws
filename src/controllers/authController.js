const { ApiError } = require('../middleware/errorHandler');
const { userRepository } = require('../repositories/userRepository');
const { signToken, verifyToken } = require('../utils/jwt');
const { revokeToken, getTokenFromHeader } = require('../middleware/auth');
const { config } = require('../utils/config');

const authController = {
  async login(req, res, next) {
    try {
      const { user_name, password } = req.body;
      const user = await userRepository.findByUsername(user_name);
      if (!user || user.password !== password) {
        throw new ApiError(401, 'Invalid credentials');
      }
      const token = signToken(
        {
          id: user.id,
          user_name: user.user_name,
          email: user.email_id || null,
          role: user.role || null,
          user_access: user.user_access || null
        },
        config.jwtSecret,
        { expiresInDays: 30 }
      );

      res.json({
        message: 'Login successful',
        token,
        expires_in_days: 30,
        user: {
          id: user.id,
          user_name: user.user_name,
          email: user.email_id || null,
          role: user.role || null,
          user_access: user.user_access || null
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Logout: revoke token if provided; frontends should still clear stored tokens.
  async logout(req, res, next) {
    try {
      const token = getTokenFromHeader(req.headers.authorization);
      if (!token) {
        throw new ApiError(401, 'Authorization token missing');
      }
      let expSeconds;
      try {
        const payload = verifyToken(token, config.jwtSecret);
        expSeconds = payload.exp;
      } catch (_e) {
        // even if verify fails, still revoke this token
      }
      revokeToken(token, expSeconds ? Number(expSeconds) : undefined);
      res.json({ message: 'Logout successful' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { authController };
