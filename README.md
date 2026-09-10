# BelPower Business

Business utility payment platform for Nigerian companies. Fund wallet, pay bills, manage branches — **not a bank** (no transfers).

## Phase 2 (current)

Payment flows on mock wallet data — no provider API until Phase 3.

- **Airtime** — network, phone, amount presets, saved beneficiaries
- **Data** — network plans
- **Electricity** — disco, prepaid/postpaid meter verify, vend token
- **Cable TV** — smartcard verify and package renew
- **Bulk payments** — multi-line batch or CSV, one wallet debit
- Buy Again from transactions and Pay from beneficiaries prefill these forms

## Phase 1 (complete)

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
- **Fund wallet** — company wallet at Head Office only (Super Admin / HQ Finance)
- **Allocate funds** — Head Office company wallet allocates to other branches (Super Admin / HQ Finance)
- **Statements** — credits/debits ledger with export

### Team & roles
- **Head Office:** Super Admin, Finance, Ops, Viewer
- **Each branch:** Admin, Finance, Ops, Viewer (branch-scoped)
- **Super Admin** invites any role (HQ or branch); **Branch Admin** invites branch roles for their branch only
- Wallet funding is company-level only for now

### Operations
- **Transactions** — searchable list with status filters, badges, detail panel, and PDF receipt download (belpower-admin receipt layout)
- **Branches** — branch cards with allocated balance and spend
- **Team** — members table, scoped invite modal
- **Beneficiaries** — saved utility accounts
- **Analytics** — mock spend charts by branch and service
- **Settings** — company profile (read-only) with verified email/phone updates and logo change (Super Admin)
- **Notifications** — bell dropdown in the top bar (newest 5)

### Security (mock)
- Route-level RBAC — direct URLs blocked when role lacks permission
- Sidebar nav filtered by role

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

On the dashboard (dev only), use role pills to preview Head Office vs branch roles (e.g. Super Admin, HQ Finance, Branch Admin, Branch Ops).

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

- **Phase 3:** backend `/api/v1/business/*` integration
