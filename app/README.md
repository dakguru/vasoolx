# VasoolX

**Every Collection. Digitally Controlled.**

A premium, multilingual loan-collection & finance management web app for daily / weekly / monthly lending "lines" — rebuilt from the Vasool Management mobile app with an iOS-style **Liquid Glass** UI, **Supabase** backend, and **English / Tamil / Hindi** support.

> Tagline: *Designed for Trust · Engineered for Security.*

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — custom Liquid-Glass design system (light + dark, glassmorphism)
- **Supabase** — Postgres + Row Level Security + Auth (email/password) + Storage
- Custom **context-based i18n** (en / ta / hi), fonts include Noto Sans Tamil & Devanagari
- Zero-dependency SVG charts, `lucide-react` icons

## Running locally

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000.

### Demo mode (default — no backend needed)

If Supabase env vars are **not** set, the app runs fully in **demo mode**: all data
(lines, customers, loans, payments, investments, expenses) lives in the browser's
`localStorage` and is pre-seeded with a realistic "Karur" line so every screen is alive.
Login accepts any email + password. Reset the demo data from **Settings → Reset demo data**.

### Production mode (Supabase)

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (tables, RLS,
   triggers, storage bucket).
3. Copy `.env.example` → `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Restart `npm run dev`. Auth and all data now use Supabase.

## Features (parity with the source app + extras)

| Area | Screens |
| --- | --- |
| **Auth** | Email login, signup (name, phone, email, password), trilingual switch |
| **Dashboard** | Collect (Instant/Bulk by date & area), KPI tiles, 7-day collection chart, quick actions, tips |
| **Customers** | List with loan progress bars, search, add-customer sheet, empty state |
| **Lines** | Manage lines, add/edit line (loan type, interest, fees, installments, bad-loan days, toggles), line switcher |
| **Areas** | Manage areas per line |
| **Finance** | Investment / Expense tabs, add sheets, totals |
| **Reports** | Loan Summary, Plan, Investment, Expense, Multi-Line, Customer, Ledger |
| **Users** | Agent / Partner access with permission descriptions, add-user request |
| **Settings** | Profile, preferences (biometric, notifications, language, theme), subscription, app links, logout |
| **Subscription** | Monthly ₹100 / Annual ₹1,000 (Best Value), trial state |

Extras beyond the screenshots: live KPI dashboard, collection trend chart, customer
repayment progress, dark mode, PWA manifest, and a production Supabase schema with RLS.

## Project structure

```
src/
  app/
    (auth)/login, signup
    (app)/dashboard, customers, finance, reports, settings,
          lines, areas, users, users/add, subscription
  components/
    ui/         GlassCard, Button, Input, Sheet, Chart, Segmented, Toggle …
    shell/      TopBar, BottomNav, LanguageSwitcher
    sheets/     Customer, Finance, Line, Area form sheets
  lib/
    i18n/       messages (en/ta/hi) + provider
    theme/      light/dark provider
    auth/       email auth (Supabase or demo)
    data/       types, store (localStorage), seed, selectors
    supabase/   browser + server clients
supabase/schema.sql
public/brand/   VasoolX logo assets (app icon, wordmarks, symbol)
```

## Roadmap

- Loan detail + installment schedule view, PDF receipts, WhatsApp reminders
- Report drill-downs with real filters + PDF/CSV export
- Route/day-book with cash reconciliation, maker-checker audit trail
- Native Kotlin mobile app sharing the same Supabase backend
