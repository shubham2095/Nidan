const ApiError = require('../utils/ApiError');
const { zodDetails } = require('./errorHandler');

/**
 * Validates req.params / req.query / req.body against zod schemas and exposes the
 * parsed (trimmed, coerced) values as req.valid.{params,query,body}.
 * (Express 5 makes req.query read-only, so parsed values are never written back.)
 */
const validate = (schemas) => (req, res, next) => {
  // Merge, so a route may run several validators (e.g. params first, body after a file upload).
  req.valid ??= {};
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      throw new ApiError(422, 'Please check the highlighted fields', zodDetails(result.error));
    }
    req.valid[part] = result.data;
  }
  next();
};

module.exports = validate;
