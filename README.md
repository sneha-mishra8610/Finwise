# FinWise — Smart Expense Splitting

> **Split smarter. Settle faster.**

A full-stack expense management app built solo — real-time group splitting, per-expense chat threads, dispute flagging, multi-currency support, and financial analytics. No UI library. No charting library. Just React + Spring Boot.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-6c5ce7?style=for-the-badge)](https://finwise-coral.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-4CAF50?style=for-the-badge)](https://finwise-api-rrjv.onrender.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge)](https://finwise-coral.vercel.app)

> ⚠️ **Cold start warning:** Backend is hosted on Render free tier and spins down after inactivity. First load may take 30–60 seconds to wake up — subsequent requests are instant. If the app seems unresponsive, wait a moment and refresh.

---

## What makes FinWise different

Most expense apps stop at splitting and settling. FinWise goes further:

| # | Feature | Why it matters |
|---|---|---|
| 1 | **Per-expense chat threads** | Dispute a specific expense in context — not buried in a group chat |
| 2 | **Expense flagging & dispute system** | Any participant can flag disagreement; flagged expenses surface separately |
| 3 | **Full edit audit trail** | Every change to an expense is timestamped and logged |
| 4 | **Recurring expenses** | Daily / Weekly / Monthly / Quarterly/ Yearly with start & end dates and next-occurrence preview |
| 5 | **Settle-all-with-friend** | One action to clear all shared debts with a specific friend |
| 6 | **Multi-format export with date filtering** | PDF, Excel, Word — filtered by Today / Week / Month / Quarter / Year / All Time |
| 7 | **Friend workspace** | A dedicated mini-dashboard for you + one friend: balances, shared expenses, history |
| 8 | **Budget history** | Last 6 periods tracked, not just the current month |
| 9 | **Canvas-rendered spending chart** | Custom-built — zero third-party charting library |
| 10 | **Financial health metrics** | Settlement rate % and average days-to-settle on the Account page |
| 11 | **Deep-link URLs** | `/expenses/:id`, `/friends/:id`, `/groups/:id` — all shareable and bookmarkable |
| 12 | **Configurable settlement reminders** | 3 / 5 / 7 day delay, with one-stop reminder-or-settle flow

---

## Screenshots

### Login
![Login](./screenshots/login.png)
*Google OAuth and email/password login. "Split smarter. Settle faster."*

---

### Dashboard
![Dashboard](./screenshots/dashboard.png)
*Spending trend (canvas-rendered, no library), category donut, friend balances, budget progress, and action-required panel — all configurable by Daily / Weekly / Monthly / Quarterly / Yearly.*

---

### Expenses
![Expenses](./screenshots/expenses.png)
*322 expenses logged. Tabs for Personal, Group, Unsettled, Recurring, and Flagged — each with its own count. Total spent, you owe, and owed to you surfaced at the top.*

---

### Add Expense — Custom Split
![Add Expense Split](./screenshots/add-expense-unequal.png)
*Unequal split with live per-member percentage calculation and a "Balanced ✓" validator. Supports equal, unequal, and percentage modes.*

---

### Add Expense — Recurring
![Add Expense Recurring](./screenshots/add-expense-recurring.png)
*Set an expense to repeat on any interval. Next occurrence previewed before saving.*

---

### Group Detail
![Group Detail](./screenshots/group-detail.png)
*Per-group view: total spent, your share, settlement progress (55 of 56 complete), per-member spending donut, top categories, and a filterable expense table (All / Unsettled / Settled).*

---

### Groups
![Groups](./screenshots/groups.png)
*All groups with total spent, your share, and settlement status at a glance.*

---

### Expense Detail + Chat
![Expense Chat](./screenshots/expense-chat.png)
*Every expense has its own chat thread. Settle up or flag a dispute directly from the modal — keeps context attached to the expense, not lost in a group feed.*

---

### Group Chat
![Group Chat](./screenshots/group-chat.png)
*Real-time per-group chat with timestamps and read receipts.*

---

### Notifications
![Notifications](./screenshots/notifications.png)
*Debt alerts with multi-currency amounts (INR, GBP, EUR), expense-added events, and overdue settlement reminders. Auto-marks as read on view.*

---

### Activity Feed
![Activity](./screenshots/activity.png)
*Full audit trail: expenses (including recurring), settlements, friend connections, group updates — filterable by type, sortable by date.*

---

### Friends
![Friends](./screenshots/friends.png)
*Friend list with total shared, you owe, and owes you. Invite by name + email with optional message. Remind or settle from the same dropdown.*

---

### Budget
![Budget](./screenshots/budget.png)
*Set budgets by Daily / Weekly / Monthly / Quarterly / Yearly. Budget history table shows the last 6 periods — not just the current one.*

---

### Export
![Export](./screenshots/export.png)
*PDF (expense summary + activity timeline), Excel (all transactions + category breakdown), and Word (full report + settlement history) — all filtered by time period.*

---

### Account & Preferences
![Account](./screenshots/account.png)
*Financial health metrics (settlement rate 99%, avg 60.5 days to settle), default currency, reminder delay, default split method, theme, 2FA toggle, and active session management.*

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| React Router v6 | Client-side routing + deep-link URLs |
| Vite | Build tool |
| Custom CSS | Hand-written, no framework — dark / light / system theme |
| Canvas API | Spending trend chart (no charting library) |

### Backend
| Technology | Purpose |
|---|---|
| Spring Boot (Java 17) | REST API |
| PostgreSQL | Primary database |
| JWT | Stateless authentication |
| Google OAuth2 | Social login |
| ExchangeRate API | Live multi-currency conversion |

### Infrastructure
| Technology | Purpose |
|---|---|
| Render | Backend hosting (free tier) |
| Vercel | Frontend hosting |

---

## Architecture

```
┌─────────────────────┐         REST API          ┌──────────────────────┐
│   React Frontend    │ ◄────────────────────────► │  Spring Boot API     │
│  (Vite + TS)        │                            │  (Java 17)           │
└─────────────────────┘                            └──────────┬───────────┘
                                                              │
                                                   ┌──────────▼───────────┐
                                                   │      PostgreSQL       │
                                                   └──────────────────────┘
```

---

## Feature Highlights

**Expense splitting**
- Personal, friend, and group expenses
- Equal / Unequal / Percentage splits with live balance validator
- 21 expense categories with distinct colours
- Recurring expenses (Daily / Weekly / Monthly / Yearly / Custom interval)
- Bill image URL attachment
- Flag disputed expenses; flagged tab surfaces them separately
- Full edit audit trail — every change is logged

**Groups & Friends**
- Create groups, invite members by email
- Per-group spending analytics: donut chart, member leaderboard, top categories
- Friend workspace: dedicated view for any two users' shared history
- Settle-all-with-friend in one action
- Settlement reminders with 3 / 5 / 7 day configurable delay

**Chat & Notifications**
- Per-expense chat threads for in-context dispute resolution
- Per-group chat with read receipts
- Notification centre with auto-mark-as-read
- Debt alerts in preferred display currency

**Analytics & Export**
- Canvas-rendered spending trend (Daily → Yearly granularity)
- Category breakdown donut
- Budget tracking with 6-period history
- Financial health metrics: settlement rate %, avg days to settle
- Export to PDF / Excel / Word with date-range filter

**Auth & Account**
- Google OAuth + JWT session management
- Deep-link URLs for expenses, groups, and friends
- Dark / Light / System theme
- Two-factor authentication
- Active session tracking

---

## Key Design Decisions

- **No UI library** — fully custom CSS with consistent design tokens (`#6c5ce7` primary, `#8be0cb` mint accent). Bundle stays lean; every pixel is intentional.
- **No charting library** — the spending trend chart is Canvas API rendered from scratch, avoiding a ~100KB dependency for one graph.
- **Per-expense chat** — attaching chat to individual expenses rather than only to groups keeps dispute context with the expense, not lost in a feed.
- **INR as base currency** — amounts stored in INR, converted at display time via live rates. Multi-currency input supported at creation.
- **Render (free tier)** — backend hosting; spins down after inactivity, so first load may take 30–60 seconds to wake up.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- PostgreSQL 14+

### Frontend
```bash
git clone https://github.com/yourusername/finwise-frontend
cd finwise-frontend
npm install
cp .env.example .env        # set VITE_API_BASE_URL
npm run dev
```

### Backend
```bash
git clone https://github.com/yourusername/finwise-api
cd finwise-api
# configure application.properties: DB credentials, JWT secret, Google OAuth, ExchangeRate API key
./mvnw spring-boot:run
```

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] AI expense categorisation from description text
- [ ] OCR bill scanning
- [ ] UPI payment integration
- [ ] WhatsApp settlement reminders

