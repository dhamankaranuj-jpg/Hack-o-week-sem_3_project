function notFound(req, res, next) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}
function errorHandler(err, _req, res, _next) {
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.code === 11000) return res.status(409).json({ success: false, error: "A record with that value already exists." });
  console.error(err);
  res.status(err.status || 500).json({ success: false, error: err.status ? err.message : "Internal server error" });
}
module.exports = { notFound, errorHandler };