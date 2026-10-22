/** Wraps `(req) => data` into an Express handler that sends it as JSON (async errors reach the error handler). */
const respond = (load, status = 200) => async (req, res) => {
  res.status(status).json(await load(req));
};

module.exports = respond;
