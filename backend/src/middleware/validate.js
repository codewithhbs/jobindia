const AppError = require('../utils/AppError');

// Joi validation factory. Usage: validate(schema) or validate(schema, 'query')
const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(new AppError(error.details.map((d) => d.message).join(', '), 422));
  }
  req[source] = value;
  next();
};

module.exports = validate;
