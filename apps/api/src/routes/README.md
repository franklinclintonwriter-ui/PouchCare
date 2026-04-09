# API route modules

Express routers are mounted only from [`../server.ts`](../server.ts). Do not add alternate `index.ts` copies of the same surface under different paths.

## Mount map (`/v1` prefix)

| Mount path | Module |
|------------|--------|
| `/auth` | `auth/index.ts` |
| `/staff`, `/tasks`, `/projects`, `/attendance`, `/leave`, `/reports`, `/performance`, `/payroll` | respective folders |
| `/finance`, `/crm`, `/assets`, `/hr`, `/services` | respective folders |
| `/backlink-packages` | `services/backlinks.ts` |
| `/broadcast`, `/support`, `/notifications`, `/search`, `/analytics` | respective folders |
| `/portal` | `portal/auth.ts` (login, register, refresh, …) |
| `/portal/me`, `/portal/wallet`, `/portal/orders`, `/portal/referrals`, `/portal/commissions` | `portal/*.ts` |
| `/admin/portal` | `admin/portal.ts` |
| `/admin` | `admin/resources.ts` (branches, devices, client-accounts, …) |

Portal **member** app data is split across `/portal` (auth) and `/portal/me`, `/portal/wallet`, etc. Admin staff operations on portal members use `/admin/portal`.
