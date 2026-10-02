# 💸 Expense & Budget Visualizer

A clean, minimal single-page web app for tracking daily expenses and visualising spending by category — no server required.

---

## Features

- **Live Total Balance** — total expenses update instantly at the top of the page
- **Add Expenses** — input form with Item Name, Amount, and Category (Food, Transport, Fun) with full client-side validation
- **Transaction History** — scrollable list of all entries with per-item delete
- **Pie Chart** — real-time Chart.js pie chart showing spending distribution by category
- **Persistent Storage** — all data saved to browser `localStorage`; survives page refreshes

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Markup     | HTML5                               |
| Styling    | CSS3 (custom properties, grid, flexbox) |
| Logic      | Vanilla JavaScript (ES2020+)        |
| Chart      | [Chart.js 4](https://www.chartjs.org/) via CDN |
| Storage    | Browser `localStorage`              |

No frameworks, no build step, no server needed.

---

## Project Structure

```
.
├── index.html          # App shell & layout
├── css/
│   └── style.css       # All styles (responsive, mobile-first)
├── js/
│   └── app.js          # All logic (state, validation, rendering, chart)
├── .gitignore
└── README.md
```

---

## Getting Started

1. **Clone the repo**

   ```bash
   git clone https://github.com/<your-username>/CodingCamp-28September26-alyanuryanahfikri.git
   cd CodingCamp-28September26-alyanuryanahfikri
   ```

2. **Open in browser** — just double-click `index.html`, or serve with any static file server:

   ```bash
   # Python (quick option)
   python -m http.server 8080
   ```

   Then visit `http://localhost:8080`.

No `npm install` needed.

---

## Usage

1. Fill in **Item Name**, **Amount**, and **Category**.
2. Click **+ Add Expense**.
3. The total, transaction list, and pie chart all update immediately.
4. Click **✕** on any transaction to remove it.
5. Data persists in your browser — refresh safely.

---

## Categories

| Category  | Colour  |
|-----------|---------|
| 🍔 Food      | Red-orange |
| 🚌 Transport | Teal       |
| 🎉 Fun       | Yellow     |

---

## License

MIT
