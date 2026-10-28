const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 90 },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true, min: 0.01, max: 100000000 },
  category: {
    type: String,
    required: true,
    enum: ["Salary", "Freelance", "Food", "Transport", "Shopping", "Bills", "Health", "Education", "Entertainment", "Housing", "Other"]
  },
  date: { type: Date, required: true },
  note: { type: String, trim: true, maxlength: 300, default: "" }
}, { timestamps: true });

transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, category: 1 });
module.exports = mongoose.model("Transaction", transactionSchema);