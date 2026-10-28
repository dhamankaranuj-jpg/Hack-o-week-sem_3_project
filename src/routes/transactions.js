const express = require("express");
const Transaction = require("../models/Transaction");
const router = express.Router();

const allowedCategories = ["Salary", "Freelance", "Food", "Transport", "Shopping", "Bills", "Health", "Education", "Entertainment", "Housing", "Other"];
function validatePayload(body) {
  const { title, type, amount, category, date } = body;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 90) return "Title is required (maximum 90 characters).";
  if (!["income", "expense"].includes(type)) return "Type must be income or expense.";
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return "Amount must be a positive number.";
  if (!allowedCategories.includes(category)) return "Choose a valid category.";
  if (!date || Number.isNaN(new Date(date).getTime())) return "A valid date is required.";
  if (body.note && (typeof body.note !== "string" || body.note.length > 300)) return "Note must be 300 characters or fewer.";
  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const { type, category, search, from, to, page = "1", limit = "100" } = req.query;
    const filter = {};
    if (type && ["income", "expense"].includes(type)) filter.type = type;
    if (category && allowedCategories.includes(category)) filter.category = category;
    if (search) filter.title = { $regex: String(search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (from || to) {
      filter.date = {};
      if (from && !Number.isNaN(new Date(from).getTime())) filter.date.$gte = new Date(from);
      if (to && !Number.isNaN(new Date(to).getTime())) {
        const end = new Date(to); end.setHours(23, 59, 59, 999); filter.date.$lte = end;
      }
    }
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
    const [items, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1, createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
      Transaction.countDocuments(filter)
    ]);
    res.json({ success: true, data: items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const problem = validatePayload(req.body);
    if (problem) return res.status(400).json({ success: false, error: problem });
    const item = await Transaction.create({
      title: req.body.title.trim(), type: req.body.type, amount: Number(req.body.amount),
      category: req.body.category, date: new Date(req.body.date), note: req.body.note || ""
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await Transaction.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: "Transaction not found." });
    const merged = { ...existing.toObject(), ...req.body };
    const problem = validatePayload(merged);
    if (problem) return res.status(400).json({ success: false, error: problem });
    for (const key of ["title", "type", "amount", "category", "date", "note"]) {
      if (req.body[key] !== undefined) existing[key] = key === "amount" ? Number(req.body[key]) : req.body[key];
    }
    await existing.save();
    res.json({ success: true, data: existing });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Transaction not found." });
    res.json({ success: true, data: { id: deleted._id } });
  } catch (err) { next(err); }
});
module.exports = router;