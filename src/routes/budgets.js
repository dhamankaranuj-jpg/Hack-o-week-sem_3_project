const express = require("express");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const [budgets, spent] = await Promise.all([
      Budget.find().sort({ category: 1 }).lean(),
      Transaction.aggregate([
        { $match: { type: "expense", date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } }
      ])
    ]);
    const spentMap = Object.fromEntries(spent.map(x => [x._id, x.total]));
    res.json({ success: true, data: budgets.map(b => ({ ...b, spent: spentMap[b.category] || 0, remaining: b.limit - (spentMap[b.category] || 0) })) });
  } catch (err) { next(err); }
});

router.put("/:category", async (req, res, next) => {
  try {
    const limit = Number(req.body.limit);
    if (!Number.isFinite(limit) || limit < 1) return res.status(400).json({ success: false, error: "Budget limit must be greater than zero." });
    const item = await Budget.findOneAndUpdate(
      { category: req.params.category },
      { category: req.params.category, limit },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete("/:category", async (req, res, next) => {
  try {
    const item = await Budget.findOneAndDelete({ category: req.params.category });
    if (!item) return res.status(404).json({ success: false, error: "Budget not found." });
    res.json({ success: true, data: { category: item.category } });
  } catch (err) { next(err); }
});
module.exports = router;