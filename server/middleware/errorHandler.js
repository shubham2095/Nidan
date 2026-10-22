const { ZodError } = require('zod');
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`));

const zodDetails = (error) => error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));

/** Maps any thrown error to a JSON response. Request bodies are never logged (they may hold patient data). */
const errorHandler = (error, req, res, next) => {
  let status = 500;
  let message = 'Something went wrong. Please try again.';
  let details;

  if (error instanceof ApiError) {
    ({ status, message, details } = error);
  } else if (error instanceof ZodError) {
    status = 422;
    message = 'Please check the highlighted fields';
    details = zodDetails(error);
  } else if (error instanceof UniqueConstraintError) {
    status = 409;
    message = 'That record already exists';
  } else if (error instanceof ForeignKeyConstraintError) {
    status = 409;
    message = 'This record is linked to other data and cannot be changed this way';
  } else if (error instanceof ValidationError) {
    status = 422;
    message = 'Please check the highlighted fields';
    details = error.errors.map((item) => ({ field: item.path, message: item.message }));
  } else if (error.name === 'MulterError') {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'That file is too large. The limit is 10 MB.' : 'The upload could not be processed.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (error.type === 'entity.too.large') {
    status = 413;
    message = 'Request is too large';
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl.split('?')[0]} -> ${error.stack || error}`);
  }

  const body = { message };
  if (details) body.details = details;
  if (status >= 500 && !env.isProd) body.debug = error.message;
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler, zodDetails };
