require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const Transaction = require("./src/models/Transaction");
const Budget = require("./src/models/Budget");

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing. Copy .env.example to .env.");
  await mongoose.connect(process.env.MONGODB_URI);
  const records = JSON.parse(fs.readFileSync(path.join(__dirname, "data/sample-transactions.json"), "utf8"));
  await Promise.all([Transaction.deleteMany({}), Budget.deleteMany({})]);
  await Transaction.insertMany(records.map(record => ({ ...record, date: new Date(`${record.date}T12:00:00`) })));
  await Budget.insertMany([
    { category: "Food", limit: 8000 },
    { category: "Transport", limit: 2500 },
    { category: "Shopping", limit: 4000 },
    { category: "Bills", limit: 3000 }
  ]);
  console.log(`Seeded ${records.length} transactions and 4 budgets.`);
  await mongoose.disconnect();
}
seed().catch(error => { console.error(error); process.exitCode = 1; });