# Client dashboard (landing app) — AI / maintainer notes

Read this before changing `/dashboard/*` UI.

## Shell

- Layout: `components/layout/DashboardLayout.tsx` — main padding, safe-area bottom for mobile nav.
- Panels: `components/dashboard/DashboardPanel.tsx` — stack title/description/actions on small screens; actions full width under `sm`.

## Responsive rules

- **Tables**: Pair every wide table (`min-w-[…]`, horizontal scroll) with a **card list** for `md:hidden` using `NarrowWide` from `components/dashboard/ResponsiveSplit.tsx`. From `md`, show the table in `hidden md:block`.
- **Touch**: Primary actions and inputs aim for **min height ~44px** (`min-h-[44px]`, `py-2.5` on inputs). Stack buttons full width on small screens (`w-full sm:w-auto` or `sm:self-end`).
- **Grids**: Stat cards — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (or 4) so one column on narrow phones.
- **Hosting** subdomain: `HOSTING_PORTAL.md` in this folder for route order and hosting-specific patterns.

## Files map

| Area        | Primary page(s)                                      |
|------------|-------------------------------------------------------|
| Overview   | `DashboardOverviewPage.tsx`                          |
| Orders     | `OrdersPage.tsx`, `OrderDetailPage.tsx`              |
| Wallet     | `WalletPage.tsx`                                     |
| Services   | `ServicesPage.tsx`, `CartPage.tsx`                   |
| Referrals  | `ReferralsPage.tsx`                                  |
| Billing    | `BillingPage.tsx`                                    |
| Profile    | `ProfilePage.tsx`, `SettingsPage.tsx`                |
| Support    | `SupportPage.tsx`, `SupportTicketPage.tsx`           |

Shared tokens: `lib/ui.ts` (`ui` object).
