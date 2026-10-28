const express = require("express");
const Transaction = require("../models/Transaction");
const router = express.Router();

router.get("/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    if (month < 1 || month > 12 || year < 2000 || year > 2200) {
      return res.status(400).json({ success: false, error: "Invalid year or month." });
    }
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const [totals, categories, monthly] = await Promise.all([
      Transaction.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { type: "expense", date: { $gte: start, $lt: end } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } }
      ]),
      Transaction.aggregate([
        { $match: { date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } } },
        { $group: { _id: { month: { $month: "$date" }, type: "$type" }, total: { $sum: "$amount" } } },
        { $sort: { "_id.month": 1 } }
      ])
    ]);
    const income = totals.find(x => x._id === "income")?.total || 0;
    const expenses = totals.find(x => x._id === "expense")?.total || 0;
    const incomeCount = totals.find(x => x._id === "income")?.count || 0;
    const expenseCount = totals.find(x => x._id === "expense")?.count || 0;
    res.json({ success: true, data: {
      year, month, income, expenses, balance: income - expenses,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      incomeCount, expenseCount, categories,
      monthly: Array.from({ length: 12 }, (_, i) => {
        const incomeRow = monthly.find(x => x._id.month === i + 1 && x._id.type === "income");
        const expenseRow = monthly.find(x => x._id.month === i + 1 && x._id.type === "expense");
        return { month: i + 1, income: incomeRow?.total || 0, expenses: expenseRow?.total || 0 };
      })
    }});
  } catch (err) { next(err); }
});
module.exports = router;