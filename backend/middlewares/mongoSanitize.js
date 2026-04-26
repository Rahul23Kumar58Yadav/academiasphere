// middleware/mongoSanitize.js
// Drop-in replacement for express-mongo-sanitize
// Strips keys starting with $ or containing . from req.body, req.params, and req.query

const sanitize = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  return Object.keys(obj).reduce((acc, key) => {
    const isBadKey = key.startsWith("$") || key.includes(".");
    if (!isBadKey) {
      acc[key] = sanitize(obj[key]);
    }
    return acc;
  }, {});
};

const mongoSanitize = (req, res, next) => {
  if (req.body)   req.body   = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);

  // req.query is read-only in newer Express — sanitize a copy instead
  if (req.query) {
    const cleanQuery = sanitize({ ...req.query });
    Object.keys(req.query).forEach((k) => {
      if (k.startsWith("$") || k.includes(".")) {
        delete req.query[k];
      }
    });
  }

  next();
};

module.exports = mongoSanitize;