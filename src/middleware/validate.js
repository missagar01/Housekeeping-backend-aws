const { ApiError } = require('./errorHandler');

const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new ApiError(400, 'Validation failed', result.error.format()));
  }
  req.body = result.data;
  next();
};

module.exports = { validateBody };
