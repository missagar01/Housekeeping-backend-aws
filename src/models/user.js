const { z } = require('zod');

const baseUserFields = {
  user_name: z.string().min(1, 'user_name is required'),
  password: z.string().min(1, 'password is required'),
  email_id: z.string().email().optional(),
  number: z.union([z.string(), z.number()]).optional(),
  department: z.string().optional(),
  given_by: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  user_access: z.string().optional(),
  leave_date: z.string().optional(),
  remark: z.string().optional(),
  leave_end_date: z.string().optional(),
  employee_id: z.string().optional()
};

const userSchema = z.object(baseUserFields);

// Updates allow partial fields; keep user_name/password optional for PATCH
const updateUserSchema = z.object({
  ...Object.fromEntries(
    Object.entries(baseUserFields).map(([k, v]) => [k, v.optional()])
  )
});

module.exports = { userSchema, updateUserSchema };
