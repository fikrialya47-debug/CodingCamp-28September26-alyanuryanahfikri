/* =================================================
   Expense & Budget Visualizer — app.js
   Storage : localStorage key "expenses"
   ================================================= */

'use strict';

// ── DOM references ────────────────────────────────
const form            = document.getElementById('expenseForm');
const itemNameInput   = document.getElementById('itemName');
const amountInput     = document.getElementById('amount');
const categorySelect  = document.getElementById('category');

const nameError       = document.getElementById('nameError');
const amountError     = document.getElementById('amountError');
const categoryError   = document.getElementById('categoryError');

const totalAmountEl   = document.getElementById('totalAmount');
const transactionList = document.getElementById('transactionList');
const listEmpty       = document.getElementById('listEmpty');
const chartEmptyEl    = document.getElementById('chartEmpty');

const chartCanvas     = document.getElementById('expenseChart');

// Challenge 1
const themeToggleBtn  = document.getElementById('themeToggle');
const themeIconEl     = document.getElementById('themeIcon');

// Challenge 2
const sortSelect      = document.getElementById('sortSelect');

// Challenge 3
const spendingLimitInput = document.getElementById('spendingLimit');
const limitHintEl        = document.getElementById('limitHint');

// ── Chart colours (aligned with CSS variables) ────
const CATEGORY_COLORS = {
  Food:      '#ff6b6b',
  Transport: '#4ecdc4',
  Fun:       '#ffe66d',
};

const CATEGORIES = ['Food', 'Transport', 'Fun'];

// ── State ─────────────────────────────────────────
let expenses     = [];   // Array<{ id, name, amount, category, date, timestamp }>
let chart        = null; // Chart.js instance
let currentSort  = 'date-desc';   // Challenge 2: active sort key
let spendingLimit = null;          // Challenge 3: number | null

// ── LocalStorage helpers ──────────────────────────
const STORAGE_KEY       = 'expenses';
const THEME_KEY         = 'theme';
const SORT_KEY          = 'sort';
const LIMIT_KEY         = 'spendingLimit';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// ─────────────────────────────────────────────────
// CHALLENGE 1 — Dark / Light mode toggle
// ─────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.setAttribute('aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  // Respect saved preference, otherwise check OS preference
  const preferred = saved
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(preferred);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Validation ────────────────────────────────────
function validateForm() {
  let valid = true;

  const name     = itemNameInput.value.trim();
  const amount   = parseFloat(amountInput.value);
  const category = categorySelect.value;

  // Name
  if (!name) {
    showError(itemNameInput, nameError);
    valid = false;
  } else {
    clearError(itemNameInput, nameError);
  }

  // Amount
  if (!amountInput.value || isNaN(amount) || amount <= 0) {
    showError(amountInput, amountError);
    valid = false;
  } else {
    clearError(amountInput, amountError);
  }

  // Category
  if (!category) {
    showError(categorySelect, categoryError);
    valid = false;
  } else {
    clearError(categorySelect, categoryError);
  }

  return valid;
}

function showError(input, msgEl) {
  input.classList.add('invalid');
  msgEl.classList.add('visible');
}

function clearError(input, msgEl) {
  input.classList.remove('invalid');
  msgEl.classList.remove('visible');
}

// Clear errors on user interaction
[itemNameInput, amountInput, categorySelect].forEach((el) => {
  el.addEventListener('input', () => {
    el.classList.remove('invalid');
    // hide corresponding error
    const errorId = {
      itemName: 'nameError',
      amount:   'amountError',
      category: 'categoryError',
    }[el.id];
    if (errorId) document.getElementById(errorId).classList.remove('visible');
  });
});

// ── Add expense ───────────────────────────────────
form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const expense = {
    id:        crypto.randomUUID(),
    name:      itemNameInput.value.trim(),
    amount:    parseFloat(parseFloat(amountInput.value).toFixed(2)),
    category:  categorySelect.value,
    date:      new Date().toLocaleDateString('en-US', {
                 month: 'short', day: 'numeric', year: 'numeric',
               }),
    timestamp: Date.now(), // used for date-based sorting
  };

  expenses.unshift(expense); // newest first in raw array
  saveToStorage();
  renderAll();

  // Reset form (keep spending limit intact)
  itemNameInput.value  = '';
  amountInput.value    = '';
  categorySelect.value = '';
  [itemNameInput, amountInput, categorySelect].forEach((el) => {
    el.classList.remove('invalid');
  });
  [nameError, amountError, categoryError].forEach((el) => {
    el.classList.remove('visible');
  });
});

// ── Delete expense ────────────────────────────────
function deleteExpense(id) {
  expenses = expenses.filter((e) => e.id !== id);
  saveToStorage();
  renderAll();
}

// ── Render: total balance ─────────────────────────
function renderTotal() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalAmountEl.textContent = formatCurrency(total);
}

// ── Render: transaction list ──────────────────────
function renderList() {
  // Remove existing transaction items (keep the empty state p)
  Array.from(transactionList.querySelectorAll('.transaction-item')).forEach((el) =>
    el.remove()
  );

  if (expenses.length === 0) {
    listEmpty.style.display = 'block';
    return;
  }

  listEmpty.style.display = 'none';

  // ── Challenge 2: sort a shallow copy ──
  const sorted = getSortedExpenses();

  const fragment = document.createDocumentFragment();

  sorted.forEach((expense) => {
    // ── Challenge 3: check against spending limit ──
    const isOverLimit = spendingLimit !== null && expense.amount > spendingLimit;

    const item = document.createElement('div');
    item.className = 'transaction-item' + (isOverLimit ? ' over-limit' : '');
    item.dataset.category = expense.category;
    item.setAttribute('role', 'listitem');

    item.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-name" title="${escapeHtml(expense.name)}">${escapeHtml(expense.name)}${isOverLimit ? '<span class="over-limit-badge">⚠ Over limit</span>' : ''}</span>
        <span class="transaction-meta">
          <span class="transaction-badge badge-${expense.category}">${categoryEmoji(expense.category)} ${expense.category}</span>
          &nbsp;${expense.date}
        </span>
      </div>
      <span class="transaction-amount">${formatCurrency(expense.amount)}</span>
      <button
        class="btn-delete"
        aria-label="Delete ${escapeHtml(expense.name)}"
        data-id="${expense.id}"
        title="Delete"
      >✕</button>
    `;

    fragment.appendChild(item);
  });

  transactionList.appendChild(fragment);

  // Event delegation for delete buttons
  transactionList.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteExpense(btn.dataset.id));
  });
}

// ── Render: pie chart ─────────────────────────────
function renderChart() {
  // Compute totals per category
  const totals = CATEGORIES.map((cat) =>
    expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  );

  const hasData = totals.some((v) => v > 0);

  if (!hasData) {
    chartEmptyEl.classList.add('visible');
    chartCanvas.style.display = 'none';
    if (chart) {
      chart.destroy();
      chart = null;
    }
    return;
  }

  chartEmptyEl.classList.remove('visible');
  chartCanvas.style.display = 'block';

  const data = {
    labels:   CATEGORIES,
    datasets: [{
      data:            totals,
      backgroundColor: CATEGORIES.map((c) => CATEGORY_COLORS[c]),
      borderColor:     '#ffffff',
      borderWidth:     3,
      hoverOffset:     10,
    }],
  };

  if (chart) {
    // Update existing chart in-place (smoother)
    chart.data = data;
    chart.update();
    return;
  }

  chart = new Chart(chartCanvas, {
    type: 'pie',
    data,
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding:   16,
            font:      { size: 13 },
            boxWidth:  14,
            boxHeight: 14,
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const value = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return ` ${formatCurrency(value)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// ── Render all ────────────────────────────────────
function renderAll() {
  renderTotal();
  renderList();
  renderChart();
}

// ── Utility helpers ───────────────────────────────
function formatCurrency(value) {
  return value.toLocaleString('en-US', {
    style:    'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function categoryEmoji(cat) {
  return { Food: '🍔', Transport: '🚌', Fun: '🎉' }[cat] ?? '';
}

// ─────────────────────────────────────────────────
// CHALLENGE 2 — Sort transactions
// ─────────────────────────────────────────────────
function getSortedExpenses() {
  const copy = [...expenses];
  switch (currentSort) {
    case 'date-desc':
      return copy.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    case 'date-asc':
      return copy.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);
    case 'category-asc':
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return copy;
  }
}

function initSort() {
  const saved = localStorage.getItem(SORT_KEY);
  if (saved) {
    currentSort = saved;
    sortSelect.value = saved;
  }
}

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  localStorage.setItem(SORT_KEY, currentSort);
  renderList(); // only list needs re-render; totals/chart unchanged
});

// ─────────────────────────────────────────────────
// CHALLENGE 3 — Spending limit
// ─────────────────────────────────────────────────
function applySpendingLimit(raw) {
  const parsed = parseFloat(raw);
  if (!raw || isNaN(parsed) || parsed <= 0) {
    spendingLimit = null;
    limitHintEl.textContent = '';
    localStorage.removeItem(LIMIT_KEY);
  } else {
    spendingLimit = parseFloat(parsed.toFixed(2));
    limitHintEl.textContent = `Transactions above ${formatCurrency(spendingLimit)} will be highlighted.`;
    localStorage.setItem(LIMIT_KEY, spendingLimit);
  }
  renderList(); // refresh highlights immediately
}

function initSpendingLimit() {
  const saved = localStorage.getItem(LIMIT_KEY);
  if (saved) {
    spendingLimitInput.value = saved;
    applySpendingLimit(saved);
  }
}

// Update limit live as the user types (debounced slightly)
let limitDebounce = null;
spendingLimitInput.addEventListener('input', () => {
  clearTimeout(limitDebounce);
  limitDebounce = setTimeout(() => applySpendingLimit(spendingLimitInput.value), 400);
});

// ── Boot ──────────────────────────────────────────
expenses = loadFromStorage();
initTheme();
initSort();
initSpendingLimit();
renderAll();
