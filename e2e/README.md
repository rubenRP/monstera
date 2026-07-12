# E2E tests (Playwright)

Phase 2 end-to-end coverage. Today: smoke test on the public login page. Full user flows come next.

## Run locally

```bash
npm run test:e2e
```

Playwright builds the app, runs `nuxt preview` on port 3000, and executes specs in `e2e/`.

## Planned flows (phase 2)

| Flow | Route | Notes |
|------|-------|-------|
| Landing | `/` | Public hero, features, GitHub link without session |
| Login OTP | `/login` | Test project Supabase or local `supabase start` |
| Home care | `/` | Complete / skip watering |
| Create plant | `/plants/new` | Form → detail |
| Calendar | `/calendar` | Tasks by date |
| Edit plant health | `/plants/[id]/edit` | `HealthSemaphore` |

## CI data environment (choose one later)

- **Local Supabase in Actions**: `supabase start` + migrations (~2–4 min).
- **Remote staging project**: GitHub secrets `SUPABASE_URL`, `SUPABASE_KEY`, `NUXT_SUPABASE_SECRET_KEY`.

Workflow: [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) (manual / nightly; not a required check until stable).

## Selectors

Prefer `data-testid`, `role`, and `aria-*` over translated copy. Add `data-testid` on critical actions when implementing flows.
