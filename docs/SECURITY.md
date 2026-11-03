# Security

Audit date: 3 November 2026.

## How the site is put together (what there is to protect)

- **The website** is static files on Cloudflare Pages. It reads the published catalogue straight from Sanity in the browser, without a token.
- **One Cloudflare Pages Function** (`functions/_middleware.ts`) runs before every request. It provides the test-site password, the `/studio` shortcut, security headers and method checks.
- **Sanity** (project `sxg9pxs1`) holds the catalogue. Editing requires a Sanity login with project membership.
- **No database of our own, no user accounts, no stored customer data, no payments.** Enquiries go from the customer's own WhatsApp to the business.

## Controls in place

| Area | Control | Where |
|---|---|---|
| Test-site access | Password (HTTP Basic Auth) while `SITE_PASSWORD` is set. Compared in constant time | `edge/basicAuth.ts` |
| Brute force | 10 wrong passwords per IP → blocked for 15 minutes (`429`). Counted per Cloudflare edge instance | `edge/rateLimit.ts` |
| Request methods | Only `GET`/`HEAD`; anything else → `405` | middleware |
| Security headers | CSP, HSTS, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy and COOP on every response, including 401/302/405. A test keeps `_headers` in sync | `edge/securityHeaders.ts`, `apps/web/public/_headers` |
| XSS | React escapes all text. No `dangerouslySetInnerHTML`. CSP allows scripts only from the site itself. Links from Sanity must be `https:` (enforced in the site and in Studio). Images must come from `cdn.sanity.io` | `packages/core/src/catalogue/parse.ts`, `studio/schemaTypes/settings.ts` |
| Form input | Length limits, validation, and stripping of control, zero-width and bidi-override characters before text goes into the WhatsApp message | `packages/core/src/sanitize.ts` |
| Prices | Never taken from the browser. Always recalculated from the validated catalogue. Unpriced items can't be quoted | `packages/core/src/estimate.ts` |
| Secrets | None in the code or git history (checked with pattern search and `secretlint`). `.env` files are git-ignored | — |
| Build output | No source maps, no debug logging, no env secrets in the bundle (checked by building with a dummy `SITE_PASSWORD`) | `apps/web/vite.config.ts` |

## Environment variables

| Name | Where | Secret? |
|---|---|---|
| `SITE_PASSWORD` | Cloudflare Pages → Variables and Secrets (type **Secret**) | **Yes.** Only the Pages Function reads it, and it never reaches the browser |
| `STUDIO_URL` | Cloudflare Pages (optional) | No |
| `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET` | Cloudflare Pages / `apps/web/.env.local` (optional, defaults in code) | **No.** Every `VITE_` value is compiled into the public website, so never put a secret in a `VITE_` variable |
| `SANITY_STUDIO_*` | `studio/.env` | No. Also compiled into the Studio |
| `NODE_VERSION` | Cloudflare Pages | No |

## Dependencies

- **Website (what customers download): 0 known vulnerabilities.** That's React 19, React Router 7, react-icons and zod 4.
- **Developer tools:** updated to patched versions (Vite 7.3, Vitest 4.1). One Vite version is pinned across the repo with an `overrides` entry.
- **Sanity Studio / CLI (4.22.1):** `npm audit` still reports 18 issues (6 high, 12 moderate), all inside Sanity's command-line tools. Examples are zip handling in `adm-zip` and glob/uuid in its build tooling. They only run on your computer when you run `sanity deploy` or `sanity dataset import` on files you trust, and they never reach the website. The fix is Sanity 6, a two-major-version upgrade that needs Vite 8 and changes the Studio's UI library. Do it as its own task, with testing.

Note: this repo's lockfile was generated with npm 11 because of an npm 10 bug while resolving peer dependencies. Cloudflare's npm 10 installs from it without problems (`npm ci` was tested).

## Owner checklist (needs your accounts; can't be done from code)

- [ ] **Sanity → sxg9pxs1 → Members:** only people who need it, with the lowest role that works (Editor for content). Remove anyone who has left.
- [ ] **Sanity → API → Tokens:** there should be **none**, because the website doesn't need one. Delete any you don't recognise.
- [ ] **Sanity → API → CORS origins:** only `https://cakes.beyondscrumptious.com`, your `*.pages.dev` address(es), and `http://localhost:5173` while developing. **Allow credentials** off on all.
- [ ] **Sanity → Datasets:** `production` is *Public* by design (it's the catalogue). Never put private information in Sanity.
- [ ] **Two-factor authentication** on the Google/GitHub/email account you use to log in to Sanity, Cloudflare and GitHub.
- [ ] **Cloudflare:** `SITE_PASSWORD` saved as a **Secret** with a long password (e.g. four random words). Only trusted people in the Cloudflare account.
- [ ] **GitHub:** the repository is **public**. That's fine, since it contains no secrets, but switch it to private if you'd rather people can't read the code.
- [ ] **Backups:** occasionally run `npx sanity dataset export production backup.tar.gz` in the `studio` folder.
- [ ] **When going live** on `cakes.beyondscrumptious.com`, you can add a Cloudflare WAF rate-limiting rule for the zone as a second layer.
