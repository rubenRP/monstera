# Security Policy

## Supported versions

Security fixes are applied to the default branch (`main`). Self-hosted deployments should track `main` or apply security patches promptly.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

Email **hola@rubenr.dev** with:

- Description of the issue
- Steps to reproduce
- Impact assessment (if known)
- Suggested fix (optional)

You should receive a response within a few business days. We will coordinate disclosure and a fix before any public announcement when appropriate.

## Self-hosted deployments

- Set **`CRON_SECRET`** in production. Cron endpoints (`/api/cron/*`) accept `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`. Without it (and without Vercel's `x-vercel-cron` header), requests are rejected — but always configure the secret on self-hosted instances.
- Never expose **`NUXT_SUPABASE_SECRET_KEY`** (service role) to the client or commit it to version control.
- Use Supabase **RLS** on all user tables; do not bypass with the secret key on the client.
- Rotate Supabase, Cursor, Perenual, VAPID, and cron secrets if they may have been leaked.

See [docs/self-hosting.md](docs/self-hosting.md) for deployment hardening.
