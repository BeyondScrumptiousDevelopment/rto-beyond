# Beyond Scrumptious — Ready-to-Order Cake Builder

The separate site for `cakes.beyondscrumptious.com`. Customers pick a cake design, configure it (size and layers, flavours, decorations, extras), see an itemised **estimate** and send an **enquiry** via WhatsApp. It is an enquiry tool only: it takes no payment, confirms no orders and reserves no dates.

It does not replace or touch the main site (`beyondscrumptious.com`, repo `websiteBS`) or that site's Sanity project.

| Path | What it is |
|---|---|
| `packages/core` | The pricing engine, decoration inheritance, date rules and WhatsApp message builder, written in pure TypeScript and fully unit-tested |
| `apps/web` | The customer website (React, Vite, Tailwind), styled to match the main site |
| `studio` | The Cakes Sanity Studio (schemas, desk structure, decoration overview) and the starter catalogue in `studio/seed` |
| `docs/` | [Phase 1 audit](docs/PHASE-1-AUDIT.md), [deployment](docs/DEPLOYMENT.md), [Studio guide for the owner](docs/CMS-GUIDE.md) |

```bash
npm install
npm test        # core + studio unit tests
npm run e2e     # browser tests (desktop, iPhone, Android viewports)
npm run dev     # website (needs apps/web/.env.local, see .env.example)
```

All catalogue data (prices, products, flavours, decorations, contact details, wording) lives in Sanity. The only data in the repo is clearly fictitious test fixtures, plus the seed file of owner-supplied starting data.
