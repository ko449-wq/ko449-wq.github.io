# Expense Insights — browser budget dashboard

[Open interactive demo](https://ko449-wq.github.io/projects/expense-insights/)

A local-only spending dashboard showing transaction input, monthly grouping, category breakdowns, budget progress, and CSV export. The application is an educational demonstration: it **does not** connect to banks or transmit financial information.

## Engineering highlights
- Integer-cent calculations in `finance.mjs` avoid common floating-point currency errors.
- Validates positive amounts, reporting dates, descriptions, and categories.
- Dynamic bar visualization implemented with accessible HTML/CSS rather than third-party chart dependencies.
- Testable monthly aggregation and RFC 4180-style CSV quoting.
- Separates application logic from DOM/event concerns; persists to browser `localStorage`.

Run locally from the repository root with `python3 -m http.server 8000`; open `/projects/expense-insights/`. Run unit tests with `node --test projects/expense-insights/tests/*.test.mjs`.

**Note:** Sample transactions are provided as demonstrations. User-entered data never leaves the browser. The initial reporting month follows your local clock, so demonstration transactions may be visible when switching to November 2026.
