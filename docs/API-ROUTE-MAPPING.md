# PouchCare API Route Mapping

This document maps the **Node API** (`apps/api`) and **WordPress REST API** (`mvp/pouchcare-builder`) endpoints.

## Customer Portal Endpoints

| Operation | Node API | WP REST API |
|-----------|----------|-------------|
| **Snapshot** |||
| Get snapshot | `GET /customer/snapshot` | `GET /wp-json/pouchcare/v1/customer/snapshot` |
| Save snapshot | `PUT /customer/snapshot` | `PUT /wp-json/pouchcare/v1/customer/snapshot` |
| **Events** |||
| Post event | `POST /customer/events` | `POST /wp-json/pouchcare/v1/customer/events` |
| **Profile** |||
| Get profile | `GET /customer/profile` | (via snapshot) |
| Update profile | `PATCH /customer/profile` | `PATCH /wp-json/pouchcare/v1/customer/profile` |
| **Settings** |||
| Update settings | `PATCH /customer/settings` | `PATCH /wp-json/pouchcare/v1/customer/settings` |
| **Websites** |||
| List | `GET /customer/websites` | `GET /wp-json/pouchcare/v1/customer/websites` |
| Create | `POST /customer/websites` | `POST /wp-json/pouchcare/v1/customer/websites` |
| Get | `GET /customer/websites/:id` | `GET /wp-json/pouchcare/v1/customer/websites/:id` |
| Update | `PATCH /customer/websites/:id` | `PATCH /wp-json/pouchcare/v1/customer/websites/:id` |
| Delete | `DELETE /customer/websites/:id` | `DELETE /wp-json/pouchcare/v1/customer/websites/:id` |
| **Subscriptions** |||
| List | `GET /customer/subscriptions` | `GET /wp-json/pouchcare/v1/customer/subscriptions` |
| Create | `POST /customer/subscriptions` | `POST /wp-json/pouchcare/v1/customer/subscriptions` |
| Get | `GET /customer/subscriptions/:id` | `GET /wp-json/pouchcare/v1/customer/subscriptions/:id` |
| Update | `PATCH /customer/subscriptions/:id` | `PATCH /wp-json/pouchcare/v1/customer/subscriptions/:id` |
| Delete | `DELETE /customer/subscriptions/:id` | `DELETE /wp-json/pouchcare/v1/customer/subscriptions/:id` |
| **Plugins** |||
| List | `GET /customer/plugins` | `GET /wp-json/pouchcare/v1/customer/plugins` |
| Create | `POST /customer/plugins` | `POST /wp-json/pouchcare/v1/customer/plugins` |
| Get | `GET /customer/plugins/:id` | `GET /wp-json/pouchcare/v1/customer/plugins/:id` |
| Update | `PATCH /customer/plugins/:id` | `PATCH /wp-json/pouchcare/v1/customer/plugins/:id` |
| Delete | `DELETE /customer/plugins/:id` | `DELETE /wp-json/pouchcare/v1/customer/plugins/:id` |
| **Tickets** |||
| List | `GET /customer/tickets` | `GET /wp-json/pouchcare/v1/customer/tickets` |
| Create | `POST /customer/tickets` | `POST /wp-json/pouchcare/v1/customer/tickets` |
| Get | `GET /customer/tickets/:id` | `GET /wp-json/pouchcare/v1/customer/tickets/:id` |
| Update | `PATCH /customer/tickets/:id` | `PATCH /wp-json/pouchcare/v1/customer/tickets/:id` |
| Delete | `DELETE /customer/tickets/:id` | `DELETE /wp-json/pouchcare/v1/customer/tickets/:id` |
| **Payment Methods** |||
| List | `GET /customer/payment-methods` | `GET /wp-json/pouchcare/v1/customer/payment-methods` |
| Create | `POST /customer/payment-methods` | `POST /wp-json/pouchcare/v1/customer/payment-methods` |
| Delete | `DELETE /customer/payment-methods/:id` | `DELETE /wp-json/pouchcare/v1/customer/payment-methods/:id` |
| **API Keys** |||
| List | `GET /customer/api-keys` | `GET /wp-json/pouchcare/v1/customer/api-keys` |
| Create | `POST /customer/api-keys` | `POST /wp-json/pouchcare/v1/customer/api-keys` |
| Delete | `DELETE /customer/api-keys/:id` | `DELETE /wp-json/pouchcare/v1/customer/api-keys/:id` |
| **Invitations** |||
| List | `GET /customer/invitations` | `GET /wp-json/pouchcare/v1/customer/invitations` |
| Create | `POST /customer/invitations` | `POST /wp-json/pouchcare/v1/customer/invitations` |
| Get | `GET /customer/invitations/:id` | `GET /wp-json/pouchcare/v1/customer/invitations/:id` |
| Delete | `DELETE /customer/invitations/:id` | `DELETE /wp-json/pouchcare/v1/customer/invitations/:id` |

## Public/Marketing Endpoints

| Operation | Node API | WP REST API |
|-----------|----------|-------------|
| Health check | `GET /health` | N/A |
| Template catalog | `GET /catalog/templates` | (future) |
| Blog posts | `GET /blog/posts` | (future, or WP native) |

## Admin Portal Endpoints

| Operation | Node API | WP REST API |
|-----------|----------|-------------|
| Stats | `GET /admin/stats` | `GET /wp-json/pouchcare/v1/admin/stats` |
| Snapshot | `GET /admin/snapshot` | `GET /wp-json/pouchcare/v1/admin/snapshot` |
| Snapshot | `PUT /admin/snapshot` | `PUT /wp-json/pouchcare/v1/admin/snapshot` |
| Design tokens | `GET /admin/design-tokens` | `GET /wp-json/pouchcare/v1/admin/design-tokens` |
| Design tokens | `PUT /admin/design-tokens` | `PUT /wp-json/pouchcare/v1/admin/design-tokens` |
| Design tokens | `DELETE /admin/design-tokens` | `DELETE /wp-json/pouchcare/v1/admin/design-tokens` |

## Mode Detection

The frontend uses `getPortalMode()` from `customerPortalRepository.js`:

```
┌─────────────────────────────────────────────────────────────┐
│ getPortalMode() returns:                                    │
├─────────────────────────────────────────────────────────────┤
│ 'node'      - VITE_API_URL set OR dev mode (localhost:7481) │
│ 'wordpress' - Embedded in WP, no explicit API base          │
│ 'hybrid'    - Both Node API and WP REST configured          │
└─────────────────────────────────────────────────────────────┘
```

## Headers

Both APIs support:
- `Authorization: Bearer <token>` — JWT auth (Node) or session (WP nonce)
- `X-PouchCare-Company-Id` — Multi-company scope filtering
