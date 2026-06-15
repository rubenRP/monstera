# Deployment gate (GitHub CI → Vercel)

Monstera runs **lint**, **typecheck**, **tests**, and **build** in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) on every push and pull request. Use these checks to block merges and production deploys until the suite is green.

## GitHub: protect `main`

1. Open the repository on GitHub → **Settings** → **Branches**.
2. Add or edit a rule for **`main`**.
3. Enable **Require status checks to pass before merging**.
4. Select the **`ci`** job (workflow name: `ci`) as a required check.
5. Optional: enable **Require branches to be up to date before merging**.

After this, code cannot merge into `main` unless CI passes. Vercel production deploys from `main` will only run for commits that passed the gate (after merge).

## Vercel: wait for GitHub checks

1. Open the project in Vercel → **Settings** → **Git**.
2. If available on your plan, enable **Deployment Checks** / **Wait for GitHub checks** and link the `ci` workflow.
3. For preview deployments on pull requests, either:
   - wait for checks before promoting previews, or
   - disable automatic preview deploys until CI is stable (project preference).

Vercel does not run tests itself; it relies on GitHub required checks before merge and optional deployment checks before promote.

## Manual verification

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

CI uses placeholder Supabase env vars for build (see workflow `env` block). Local development still needs a real `.env`.
