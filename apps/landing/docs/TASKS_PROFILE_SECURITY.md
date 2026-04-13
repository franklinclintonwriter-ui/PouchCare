# Tasks — Profile & Security pages

**Files touched:**
- [`src/pages/dashboard/ProfilePage.tsx`](../src/pages/dashboard/ProfilePage.tsx)
- [`src/pages/dashboard/SettingsPage.tsx`](../src/pages/dashboard/SettingsPage.tsx)
- [`src/data/mockProfile.ts`](../src/data/mockProfile.ts)
- [`src/data/mockSecurity.ts`](../src/data/mockSecurity.ts)

---

## Profile page (`/dashboard/profile`)

| Section | Status | Notes |
|---------|--------|-------|
| **Identity** — avatar + full name | ✅ | Avatar is mock preview (no upload endpoint). Name saves via `useUpdateProfile`. |
| **Contact** — phone, WhatsApp, Telegram, Skype, preferred method | ✅ | Phone/WhatsApp → live API; Telegram/Skype/preferred → `mockProfile.ts` sessionStorage. |
| **Company** — name, VAT ID, website, industry | ✅ | Full mock — `saveMockProfile`. Wire to API when backend adds these fields. |
| **Billing address** — line1/2, city, state, zip, country | ✅ | Full mock — `saveMockProfile`. |
| **Account info** — ID, joined, status, referral code, currency | ✅ | Read-only from `usePortalMe()`. |
| **Linked services** — orders, domains, wallet | ✅ | Live: `usePortalOrders`, `usePortalWallet`; domains: `useMockHostingDomains`. |

### API gaps (connect when backend ready)
- [ ] `PATCH /portal/me` — add `company`, `vatId`, `website`, `industry`, `address` fields.
- [ ] `POST /portal/avatar` — file upload; update `avatarUrl` on `PortalUser`.
- [ ] `PATCH /portal/me` — add `telegram`, `skype`, `preferredContact`.

---

## Settings / Security page (`/dashboard/settings`)

| Panel | Status | Notes |
|-------|--------|-------|
| **1. Password** | ✅ | Live — `useChangePassword`. Eye-toggle added. |
| **2. Two-factor auth** | ✅ | Mock toggle + QR placeholder + backup codes. |
| **3. Active sessions** | ✅ | Mock data from `MOCK_SESSIONS`. Revoke buttons remove from local state. |
| **4. Login history** | ✅ | Mock data from `MOCK_LOGIN_HISTORY`. Table (desktop) + cards (mobile). |
| **5. Notification preferences** | ✅ | Toggles persist to `localStorage` via `saveNotifPrefs`. |
| **6. Appearance** | ✅ | Stores `light/dark/system` in `localStorage`. No CSS-var wiring yet. |
| **Danger zone — delete account** | ✅ | Safety guard toast. |

### API gaps
- [ ] `GET /portal/sessions` — real session list.
- [ ] `DELETE /portal/sessions/:id` — revoke session.
- [ ] `POST /portal/2fa/enable` + TOTP verification.
- [ ] `GET /portal/login-history` — real audit log.
- [ ] `PATCH /portal/notifications` — persist prefs server-side.

---

## Mock data files

| File | Purpose |
|------|---------|
| `mockProfile.ts` | Company, address, contact defaults; `loadMockProfile` / `saveMockProfile` (sessionStorage). |
| `mockSecurity.ts` | Sessions, login history, notif prefs, appearance; load/save helpers. |
