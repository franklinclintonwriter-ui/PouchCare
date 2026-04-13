# Client auth (`/my-accounts/*`) — AI / maintainer notes

## Layout

- `components/layout/AccountLayout.tsx` — header + centered column; uses safe-area padding on the main column.

## Forms

- Shared classes: `accountInputClass` / `accountTextareaClass` in `lib/ui.ts` (`text-base`, `min-h-[48px]` on inputs so iOS does not zoom on focus).
- Primary actions: `Button` with `fullWidth` on narrow viewports where appropriate.

## Routes

Login, register, forgot/reset password, verify email — `App.tsx` under `/my-accounts`.
