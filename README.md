# Moneta — Expense Tracker

A premium animated expense tracking dashboard built with HTML, CSS, vanilla JavaScript, Node.js, Express, MongoDB, Mongoose, and Chart.js.

## Features
- Monthly balance, income, expenses, and savings-rate summaries
- Create, edit, delete, search, and filter transactions
- Monthly income-vs-expense chart and expense-category doughnut chart
- Category budgets with progress indicators and overspending warnings
- CSV export
- Responsive dark interface, CSS motion, accessible dialogs, and reduced-motion support
- JSON REST API with server-side validation and consistent errors

## Requirements
- Node.js 18+
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- npm

## Setup
1. Extract this project and open a terminal in its root folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   - macOS/Linux: `cp .env.example .env`
   - Windows PowerShell: `Copy-Item .env.example .env`
4. Make sure MongoDB is running. The default URI is:
   `mongodb://127.0.0.1:27017/expense_tracker`
   If using Atlas, replace `MONGODB_URI` in `.env` with your connection string.
5. Start the server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000

The server serves the frontend and API from the same origin. You do not need a separate frontend server.

## Seed demo data (optional)
The file `data/sample-transactions.json` is a JSON example. To import its records into the local database, start MongoDB, create `.env`, then run:
```bash
npm run seed
```
The seed script clears existing transactions and budgets first. Do not run it against data you want to keep.

## API reference

All responses are JSON. Most successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": "..." }`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server/database health |
| GET | `/api/transactions` | List transactions; optional `type`, `category`, `search`, `from`, `to`, `page`, `limit` |
| POST | `/api/transactions` | Create a transaction |
| PATCH | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/summary?year=2026&month=10` | Monthly totals, category totals, and yearly chart data |
| GET | `/api/budgets` | Budgets with current-month spend |
| PUT | `/api/budgets/:category` | Create/update a category budget |
| DELETE | `/api/budgets/:category` | Delete a budget |

### Example transaction JSON
```json
{
  "title": "Groceries",
  "type": "expense",
  "amount": 1250,
  "category": "Food",
  "date": "2026-10-27",
  "note": "Weekly shopping"
}
```

Valid categories: `Salary`, `Freelance`, `Food`, `Transport`, `Shopping`, `Bills`, `Health`, `Education`, `Entertainment`, `Housing`, `Other`.

Example request:
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","type":"expense","amount":1250,"category":"Food","date":"2026-10-27","note":"Weekly shopping"}'
```

## Test
```bash
npm test
```
Tests exercise health status, JSON 404 handling, and summary input validation. They do not require a running MongoDB instance because they do not access database-dependent routes.

## Folder structure
```text
expense-tracker-pro/
├── data/
│   └── sample-transactions.json
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── middleware/
│   │   └── errors.js
│   ├── models/
│   │   ├── Budget.js
│   │   └── Transaction.js
│   └── routes/
│       ├── budgets.js
│       ├── summary.js
│       └── transactions.js
├── tests/
│   └── api.test.js
├── .env.example
├── .gitignore
├── package.json
├── seed.js
├── server.js
└── README.md
```

## Important production notes
This is a learning starter and assumes one trusted user. Before public deployment, implement authentication and per-user data isolation, rate limiting, security headers, CSRF protections if using cookies, strict production CORS policy if frontend/backend origins differ, secure secret management, backups, and monitoring. Never expose a MongoDB URI in browser code. Chart.js is loaded from a CDN in this starter; pin and self-host dependencies if your deployment policy requires it.
