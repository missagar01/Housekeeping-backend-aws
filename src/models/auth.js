const { z } = require('zod');

const loginSchema = z.object({
  user_name: z.string().min(1, 'user_name is required'),
  password: z.string().min(1, 'password is required')
});

module.exports = { loginSchema };
