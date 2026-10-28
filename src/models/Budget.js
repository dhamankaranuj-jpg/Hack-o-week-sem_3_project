const mongoose = require("mongoose");
const budgetSchema = new mongoose.Schema({
  category: {
    type: String, required: true, unique: true,
    enum: ["Food", "Transport", "Shopping", "Bills", "Health", "Education", "Entertainment", "Housing", "Other"]
  },
  limit: { type: Number, required: true, min: 1, max: 100000000 }
}, { timestamps: true });
module.exports = mongoose.model("Budget", budgetSchema);