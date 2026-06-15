# BelPower Business

Business utility payment platform for Nigerian companies. Fund wallet, pay bills, manage branches — **not a bank** (no transfers).

## Phase 1 (current)

- **Registration** — business + Super Admin signup form (mock submit)
- **Wallet** — overview, virtual account, fund wallet, statements export UI
- **Transactions** — searchable list with status filters
- **Branches** — branch cards with team/meter counts
- **Team** — members table with roles, branch, invite CTA
- **Beneficiaries** — saved utility accounts
- **Settings** — company profile + notification preferences
- **Notifications** — in-app notification feed

Still mock data / no backend API. **Phase 2:** payment flows (airtime, data, electricity, cable, bulk).

## Phase 0

- Next.js 16 + TypeScript + Tailwind 4 + Sora font
- BelPower design tokens aligned with `belpower-frontend`
- Public assets copied from `belpower-frontend` (discos, telcos, cable, fonts)
- Dashboard shell with sidebar, top bar, RBAC nav
- Digital meter display with swipe for Super Admin (multi-branch)
- Mock auth + mock dashboard data

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3002/business/sign-in](http://localhost:3002/business/sign-in) — use **Continue (demo)** to enter the dashboard.

On the dashboard (dev only), use role pills to preview Operations Officer (single meter) vs Super Admin (swipe meters).

## Repo structure

```
src/
  app/business/          # routes
  components/business/   # UI components
  constants/             # disco names, nav, RBAC
  context/               # auth (mock)
  data/                  # mock fixtures
  types/
  utils/                 # icons, formatPrice
public/                  # assets from belpower-frontend
```

## Next phases

Phase 2: payment flows and bulk payments. Phase 3: backend `/api/v1/business/*` integration.
