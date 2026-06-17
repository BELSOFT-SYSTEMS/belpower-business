# BelPower Business

Business utility payment platform for Nigerian companies. Fund wallet, pay bills, manage branches — **not a bank** (no transfers).

## Phase 1 (current)

Mock data only — no backend API until Phase 3.

### Auth & onboarding
- **Sign in** — email/password (mock; signs in as Super Admin)
- **Register** — business + Super Admin signup form
- **Forgot password** — reset link flow (mock)
- **Reset password** — set new password from email link (mock)
- **Accept invite** — team invitation acceptance (mock)

### Dashboard & shell
- Sidebar, top bar, RBAC navigation, role preview pills (dev)
- **Digital meter** — demo readings with branch carousel (Super Admin)
- **Bela chat** — floating assistant widget
- Quick actions (RBAC-gated payment shortcuts)

### Wallet
- **Overview** — company vs branch balance by role, branch selector, stats, recent activity
- **Fund wallet** — virtual account (Super Admin / Finance)
- **Allocate funds** — distribute company wallet to branches (Super Admin / Finance)
- **Statements** — credits/debits ledger with export (export: Super Admin / Finance)

### Operations
- **Transactions** — searchable list with status filters, badges, detail panel, and PDF receipt download (belpower-admin receipt layout)
- **Branches** — branch cards with allocated balance and spend
- **Team** — members table, invite modal (links to accept-invite)
- **Beneficiaries** — saved utility accounts
- **Analytics** — mock spend charts by branch and service
- **Settings** — company profile + notification preferences (Super Admin)
- **Notifications** — in-app feed

### Security (mock)
- Route-level RBAC — direct URLs blocked when role lacks permission
- Sidebar nav filtered by role

**Phase 2 next:** payment flows (airtime, data, electricity, cable, bulk).

## Phase 0 (foundation — complete)

- Next.js 16 + TypeScript + Tailwind 4 + Sora font
- BelPower design tokens aligned with `belpower-frontend`
- Public assets copied from `belpower-frontend` (discos, telcos, cable, fonts)
- Mock auth + mock dashboard data

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3002/business/sign-in](http://localhost:3002/business/sign-in) — use **Sign in** with any email/password (mock).

On the dashboard (dev only), use role pills to preview Operations Officer (single branch) vs Super Admin (all branches, meter carousel).

Root `/` redirects to `/business/sign-in`.

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

- **Phase 2:** payment flows and bulk payments
- **Phase 3:** backend `/api/v1/business/*` integration
