# Contributing to Monstera

Thanks for your interest in contributing. This project is an indoor plant care PWA built with Nuxt 4, Supabase, and optional AI integrations.

## Getting started

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure a Supabase project (see [README.md](README.md) or [docs/self-hosting.md](docs/self-hosting.md)).
4. Apply migrations: `npx supabase link` then `npx supabase db push`
5. Run the dev server: `npm run dev`

Requires **Node.js 22** (see `.nvmrc`).

## Before opening a PR

Run the same checks as CI:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Code conventions

- **i18n**: User-facing strings in `i18n/locales/es.json` and `i18n/locales/en.json` — update both languages.
- **API errors**: Use `throwApiError()` with codes from `shared/utils/i18n/apiErrors.ts`.
- **Shared code**: Import via `#shared/...` alias.
- **Schema changes**: Add a migration in `supabase/migrations/`, then update `shared/types/database.ts` and relevant Zod schemas.
- **Style**: ESLint with no trailing commas; minimal, focused diffs.

See [AGENTS.md](AGENTS.md) for architecture and patterns (especially useful with Cursor).

## Pull requests

- Describe what changed and why.
- Link related issues when applicable.
- Keep PRs focused; avoid unrelated refactors.

## Security

Do not open public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
