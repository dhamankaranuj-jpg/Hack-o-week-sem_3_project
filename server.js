require("dotenv").config();
const path = require("node:path");
const express = require("express");
const mongoose = require("mongoose");
const transactionRoutes = require("./src/routes/transactions");
const budgetRoutes = require("./src/routes/budgets");
const { notFound, errorHandler } = require("./src/middleware/errors");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api", require("./src/routes/summary"));
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing. Copy .env.example to .env.");
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(PORT, () => console.log(`Expense Tracker running at http://localhost:${PORT}`));
}
if (require.main === module) {
  start().catch(err => { console.error("Startup failed:", err.message); process.exit(1); });
}
module.exports = { app, start };