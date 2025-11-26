const { z } = require('zod');

const normalizeDate = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return value; // let regex validation handle bad formats
  }
  return undefined;
};

const dateSchema = z.preprocess(
  normalizeDate,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
);

const assignTaskSchema = z.object({
  department: z.string().min(1, 'department is required'),
  name: z.string().min(1, 'name is required'),
  task_description: z.string().min(1, 'task_description is required'),
  given_by: z.string().optional(),
  remark: z.string().optional(),
  status: z.string().optional(),
  image: z.string().optional(),
  attachment: z.string().optional(),
  frequency: z.string().optional(),
  task_start_date: dateSchema.optional(),
  submission_date: dateSchema.optional(),
  delay: z.number().int().optional(),
  remainder: z.string().optional()
});

const updateAssignTaskSchema = assignTaskSchema.partial();

const assignTaskListSchema = z.array(assignTaskSchema).min(1, 'tasks required');

module.exports = { assignTaskSchema, assignTaskListSchema, updateAssignTaskSchema };
