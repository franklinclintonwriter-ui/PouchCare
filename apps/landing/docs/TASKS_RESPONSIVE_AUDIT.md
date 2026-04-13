# Responsive audit — per-page checklist

**Breakpoints used across the project:**
- `sm`: 640px — phone landscape / small tablet
- `md`: 768px — tablet
- `lg`: 1024px — desktop
- `xl`: 1280px — wide desktop

**Global rules enforced in all new/touched pages:**
- Minimum tap target: `min-h-[44px]` on all interactive elements.
- Forms: `grid-cols-1 sm:grid-cols-2` (never fixed 2-col on mobile).
- `touch-manipulation` on all CTA buttons.
- No fixed widths on containers; use `max-w-` with `mx-auto`.

---

## Dashboard pages

| Page | Mobile | Tablet | Desktop | Notes |
|------|--------|--------|---------|-------|
| `ProfilePage` | ✅ | ✅ | ✅ | Avatar + form column on mobile; 2-col form on sm+; sidebar account card on lg+. |
| `SettingsPage` | ✅ | ✅ | ✅ | All panels full-width; session table → cards on mobile. |
| `CartPage` | ✅ | ✅ | ✅ | Sticky summary sidebar on `lg:`; stepper + remove inline on all sizes. |
| `WebToApkPage` | ✅ | ✅ | ✅ | Conversion table → cards on mobile. |
| `HostingDomainDetailPage` | ✅ | ✅ | ✅ | DNS table → cards on `<md`. 2-col grid on `lg:`. |
| `HostingOverviewPage` | ✅ | ✅ | ✅ | |
| `HostingRegisterPage` | ✅ | ✅ | ✅ | |

## Marketing pages

| Page | Mobile | Tablet | Desktop | Notes |
|------|--------|--------|---------|-------|
| `ServicesHostingPage` | ✅ | ✅ | ✅ | Plan cards use `HostingPlanCard` (no fixed 2-col). |
| `ServicesWebToApkPage` | ✅ | ✅ | ✅ | Hero demo form stacks on mobile. Features grid 1→2→3 cols. |

## Dashboard header

| Feature | Status | Notes |
|---------|--------|-------|
| Cart flyout | ✅ | `w-[min(100vw-2rem,22rem)]` — fits small phones without overflow. |
| Notification dropdown | ✅ | Same constraint already existed. |
| Mobile hamburger → sidebar drawer | ✅ | Spring animation, backdrop tap-to-close. |

---

## Known remaining gaps (lower priority)

- [ ] `DashboardOverviewPage` — stat grid could use 2-col on `sm:` (currently 1-col all the way).
- [ ] `OrdersPage` — table could add horizontal scroll on narrow viewports.
- [ ] `WalletPage` — deposit form could stack better on xs.
- [ ] Dark mode — appearance stored but CSS variables not yet wired; no visual change on toggle.
