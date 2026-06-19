// Wraps async controllers so we never repeat try/catch — errors flow to errorHandler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
