const $ = (selector) => document.querySelector(selector);
const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(amount) || 0);
const dateLabel = (date) => new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const categoryIcons = { Salary: "↗", Freelance: "✧", Food: "◉", Transport: "↗", Shopping: "◇", Bills: "▤", Health: "✚", Education: "▣", Entertainment: "♫", Housing: "⌂", Other: "◈" };
const palette = ["#62e6b2", "#9c8cff", "#ff9d9d", "#7caeff", "#f4c779", "#6ed8e5", "#e58bd0", "#a9c27b", "#e6a77c", "#7d9bbd", "#c4c9d6"];
let cashflowChart = null, categoryChart = null, allTransactions = [], toastTimer;

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}
function toast(message) {
  const element = $("#toast");
  element.textContent = message; element.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove("show"), 2800);
}
function setDefaultDate() { $("#dateInput").value = new Date().toISOString().slice(0, 10); }
function openDialog(id) { const dialog = document.getElementById(id); if (!dialog.open) dialog.showModal(); }
function closeDialog(id) { document.getElementById(id).close(); }
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
async function refresh() {
  try {
    const [summaryResult, transactionResult, budgetResult] = await Promise.all([
      api("/api/summary"), api("/api/transactions?limit=100"), api("/api/budgets")
    ]);
    renderSummary(summaryResult.data);
    allTransactions = transactionResult.data;
    renderTransactions();
    renderBudgets(budgetResult.data);
  } catch (error) {
    toast(error.message);
    $("#transactionRows").innerHTML = `<tr><td colspan="5" class="empty-hint">Could not load data. Check that MongoDB is running, then refresh.</td></tr>`;
  }
}
function renderSummary(data) {
  $("#balanceValue").textContent = money(data.balance);
  $("#incomeValue").textContent = money(data.income);
  $("#expenseValue").textContent = money(data.expenses);
  $("#savingsValue").textContent = `${data.savingsRate}%`;
  $("#donutTotal").textContent = money(data.expenses);
  $("#yearLabel").textContent = String(data.year);
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartText = "#8593ad";
  if (cashflowChart) cashflowChart.destroy();
  cashflowChart = new Chart($("#cashflowChart"), {
    type: "bar",
    data: { labels, datasets: [
      { label: "Income", data: data.monthly.map(x => x.income), backgroundColor: "#62e6b2", borderRadius: 5, maxBarThickness: 13 },
      { label: "Expenses", data: data.monthly.map(x => x.expenses), backgroundColor: "#6877a1", borderRadius: 5, maxBarThickness: 13 }
    ]},
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
      plugins: { legend: { labels: { color: chartText, usePointStyle: true, pointStyle: "circle", boxWidth: 6, font: { size: 10 } } },
        tooltip: { callbacks: { label: context => `${context.dataset.label}: ${money(context.raw)}` } } },
      scales: { x: { grid: { display: false }, ticks: { color: chartText, font: { size: 9 } }, border: { display: false } },
        y: { beginAtZero: true, grid: { color: "#ffffff0a" }, ticks: { color: chartText, font: { size: 9 }, callback: value => value >= 1000 ? `₹${value / 1000}k` : `₹${value}` }, border: { display: false } } },
      animation: { duration: 700, easing: "easeOutQuart" }
    }
  });
  if (categoryChart) categoryChart.destroy();
  const categories = data.categories || [];
  categoryChart = new Chart($("#categoryChart"), {
    type: "doughnut",
    data: { labels: categories.map(x => x._id), datasets: [{ data: categories.map(x => x.total), backgroundColor: palette, borderColor: "#121a2c", borderWidth: 4, hoverOffset: 5 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "77%",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.label}: ${money(context.raw)}` } } },
      animation: { animateRotate: true, duration: 750 }
    }
  });
  $("#categoryLegend").innerHTML = categories.length ? categories.slice(0, 5).map((item, index) =>
    `<div class="legend-row"><span class="legend-dot" style="background:${palette[index % palette.length]}"></span><span>${escapeHtml(item._id)}</span><span class="legend-amount">${money(item.total)}</span></div>`
  ).join("") : `<p class="empty-hint">Add expenses to see your breakdown.</p>`;
}
function renderTransactions() {
  const search = $("#searchInput").value.trim().toLowerCase();
  const type = $("#typeFilter").value;
  const category = $("#categoryFilter").value;
  const filtered = allTransactions.filter(item =>
    (!search || item.title.toLowerCase().includes(search) || (item.note || "").toLowerCase().includes(search)) &&
    (!type || item.type === type) && (!category || item.category === category)
  );
  const visible = filtered.slice(0, 8);
  $("#transactionCount").textContent = `Showing ${visible.length} of ${filtered.length} matching transactions`;
  $("#transactionRows").innerHTML = visible.length ? visible.map(item => {
    const income = item.type === "income";
    return `<tr>
      <td><div class="transaction-name"><span class="transaction-icon">${categoryIcons[item.category] || "◈"}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note || (income ? "Money received" : "Payment made"))}</small></span></div></td>
      <td><span class="category-tag">${escapeHtml(item.category)}</span></td>
      <td>${dateLabel(item.date)}</td>
      <td class="amount-cell ${income ? "amount-positive" : "amount-negative"}">${income ? "+" : "−"}${money(item.amount)}</td>
      <td><div class="row-actions"><button class="row-action" data-edit="${item._id}" aria-label="Edit ${escapeHtml(item.title)}" title="Edit">✎</button><button class="row-action" data-delete="${item._id}" aria-label="Delete ${escapeHtml(item.title)}" title="Delete">×</button></div></td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" class="empty-hint">No matching transactions. Add one to get started.</td></tr>`;
}
function renderBudgets(budgets) {
  $("#budgetList").innerHTML = budgets.length ? budgets.map(item => {
    const percent = Math.round(item.spent / item.limit * 100);
    const over = percent >= 100;
    return `<div class="budget-item">
      <div class="budget-item-head"><div class="budget-label"><span class="budget-emoji">${categoryIcons[item.category] || "◈"}</span><span>${escapeHtml(item.category)}</span></div><div class="budget-numbers">${money(item.spent)}<small> / ${money(item.limit)}</small></div></div>
      <div class="progress-track"><div class="progress-fill ${over ? "over" : ""}" style="width:${Math.min(100, percent)}%"></div></div>
      <div class="budget-foot"><span class="${over ? "over-text" : ""}">${over ? `${percent}% of limit` : `${Math.max(0, 100 - percent)}% remaining`}</span><button class="text-btn" data-delete-budget="${escapeHtml(item.category)}">Remove</button></div>
    </div>`;
  }).join("") : `<p class="empty-hint">No budgets yet. Set your first limit.</p>`;
}
function resetTransactionForm() {
  $("#transactionForm").reset(); $("#transactionId").value = ""; $("#transactionModalTitle").textContent = "Add transaction";
  $("#formError").textContent = ""; setDefaultDate();
}
$("#openAddBtn").addEventListener("click", () => { resetTransactionForm(); openDialog("transactionDialog"); });
$("#transactionForm").addEventListener("submit", async event => {
  event.preventDefault(); $("#formError").textContent = "";
  const id = $("#transactionId").value;
  const payload = {
    title: $("#titleInput").value.trim(),
    type: document.querySelector('input[name="type"]:checked').value,
    amount: Number($("#amountInput").value),
    category: $("#categoryInput").value,
    date: $("#dateInput").value,
    note: $("#noteInput").value.trim()
  };
  try {
    await api(id ? `/api/transactions/${id}` : "/api/transactions", {
      method: id ? "PATCH" : "POST", body: JSON.stringify(payload)
    });
    closeDialog("transactionDialog"); toast(id ? "Transaction updated." : "Transaction saved."); await refresh();
  } catch (error) { $("#formError").textContent = error.message; }
});
$("#transactionRows").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const item = allTransactions.find(x => x._id === editButton.dataset.edit);
    if (!item) return;
    resetTransactionForm(); $("#transactionId").value = item._id; $("#transactionModalTitle").textContent = "Edit transaction";
    $("#titleInput").value = item.title; $("#amountInput").value = item.amount; $("#categoryInput").value = item.category;
    $("#dateInput").value = new Date(item.date).toISOString().slice(0, 10); $("#noteInput").value = item.note || "";
    document.querySelector(`input[name="type"][value="${item.type}"]`).checked = true; openDialog("transactionDialog");
  }
  if (deleteButton) {
    const item = allTransactions.find(x => x._id === deleteButton.dataset.delete);
    if (!item || !confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try { await api(`/api/transactions/${item._id}`, { method: "DELETE" }); toast("Transaction deleted."); await refresh(); }
    catch (error) { toast(error.message); }
  }
});
$("#searchInput").addEventListener("input", renderTransactions);
$("#typeFilter").addEventListener("change", renderTransactions);
$("#categoryFilter").addEventListener("change", renderTransactions);
$("#viewAllBtn").addEventListener("click", () => {
  $("#searchInput").value = ""; $("#typeFilter").value = ""; $("#categoryFilter").value = "";
  $("#transactionCount").textContent = `Showing ${allTransactions.length} of ${allTransactions.length} transactions`;
  const original = renderTransactions; original();
  $("#transactions").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#manageBudgetBtn").addEventListener("click", () => { $("#budgetError").textContent = ""; $("#budgetForm").reset(); openDialog("budgetDialog"); });
$("#budgetForm").addEventListener("submit", async event => {
  event.preventDefault(); $("#budgetError").textContent = "";
  try {
    await api(`/api/budgets/${encodeURIComponent($("#budgetCategory").value)}`, {
      method: "PUT", body: JSON.stringify({ limit: Number($("#budgetLimit").value) })
    });
    closeDialog("budgetDialog"); toast("Budget saved."); await refresh();
  } catch (error) { $("#budgetError").textContent = error.message; }
});
$("#budgetList").addEventListener("click", async event => {
  const button = event.target.closest("[data-delete-budget]");
  if (!button) return;
  if (!confirm(`Remove the ${button.dataset.deleteBudget} budget?`)) return;
  try { await api(`/api/budgets/${encodeURIComponent(button.dataset.deleteBudget)}`, { method: "DELETE" }); toast("Budget removed."); await refresh(); }
  catch (error) { toast(error.message); }
});
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => closeDialog(button.dataset.close)));
document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach(x => x.classList.remove("active")); link.classList.add("active");
}));
$("#exportBtn").addEventListener("click", () => {
  const rows = [["Title", "Type", "Amount INR", "Category", "Date", "Note"], ...allTransactions.map(x => [x.title, x.type, x.amount, x.category, new Date(x.date).toISOString().slice(0, 10), x.note || ""])];
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a"); link.href = url; link.download = "moneta-transactions.csv"; link.click(); URL.revokeObjectURL(url);
  toast("CSV export downloaded.");
});
setDefaultDate();
refresh();