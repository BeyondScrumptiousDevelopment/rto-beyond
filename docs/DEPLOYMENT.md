# Deployment

The cake builder is a static site on **Cloudflare Pages**, reading its catalogue from a **separate Sanity project**. It does not touch the main website (`beyondscrumptious.com`, repo `websiteBS`) or that site's Sanity project.

## 1. Create the Sanity project (once)

1. Go to <https://www.sanity.io/manage> → **Create new project**. Name it "Beyond Scrumptious Cakes", with a dataset called `production` and **Public** visibility. Public is needed because the website reads published content without a token. Drafts are never public.
2. The project has been created: **Project ID `sxg9pxs1`**. It is already set as the default in the code.
3. Go to **API → CORS origins → Add origin** and add each of these, with **Allow credentials left off**:
   - `https://cakes.beyondscrumptious.com`
   - the Pages staging URL from step 3, e.g. `https://bs-cakes.pages.dev`
   - `http://localhost:5173` (only for local development)
4. Load the starting catalogue and deploy the Studio. In a terminal, from the repo:

   ```bash
   npm install
   cd studio
   cp .env.example .env          # already contains sxg9pxs1
   npx sanity login
   npx sanity dataset import seed/catalogue.ndjson production
   npx sanity deploy             # hosted Studio at https://beyondscrumptious-cakes.sanity.studio
   ```

   If that Studio hostname is taken, change `SANITY_STUDIO_HOST` in `.env`.
5. Under **Members**, invite anyone who edits prices or products, and give them the Editor role. Never create an API token for the website; it doesn't need one.

## 2. Create the Cloudflare Pages project

In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**. Choose `BeyondScrumptiousDevelopment/rto-beyond`, then:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `apps/web/dist` |
| Root directory | *(leave empty)* |

**Environment variables** (Production and Preview):

| Name | Value |
|---|---|
| `VITE_SANITY_PROJECT_ID` | `sxg9pxs1` (optional, as the code defaults to it) |
| `VITE_SANITY_DATASET` | `production` |
| `NODE_VERSION` | `22` |

Notes:

- No Functions, KV or paid add-ons are used. The site is plain static files.
- `apps/web/public/_headers` sets security headers (CSP, nosniff, referrer policy) and long caching for hashed assets.
- Deep links such as `/cakes/my-design` work because Pages serves `index.html` for unknown paths when a site has no `404.html`.
- Every push to `main` deploys to production. Pushes to other branches get their own preview URLs.

## 3. Staging check (before the custom domain)

Open the `*.pages.dev` URL and check:

- [ ] The catalogue loads and prices match Studio.
- [ ] A full enquiry opens WhatsApp to +44 7933 903000 with the right details, on a phone and a computer.
- [ ] The disclaimer appears above the WhatsApp button.
- [ ] "Request a custom cake" opens the main site's contact page.

## 4. Connect `cakes.beyondscrumptious.com` (only after approval)

In the Pages project, go to **Custom domains → Set up a domain** and enter `cakes.beyondscrumptious.com`. Because `beyondscrumptious.com` is already on Cloudflare DNS, Cloudflare adds one `CNAME cakes → <project>.pages.dev` record and issues the HTTPS certificate. The apex, `www`, MX and every other record stay as they are, and the main site's Pages project (`websitebs`) is not touched.

## How quickly changes appear

The site loads the catalogue from Sanity's API CDN every time a page is opened. **Publishing** a change in Studio normally shows on the site within about a minute, and no rebuild or deploy is needed. Saved but unpublished drafts never appear.

If Sanity can't be reached, the site shows an error with a "Try again" button and **no prices**. It never falls back to old or cached prices.

## Running locally

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # optional; defaults to sxg9pxs1
npm run dev            # website at http://localhost:5173
npm run studio:dev     # Studio at http://localhost:3333 (needs studio/.env)
npm test               # pricing engine, Studio schema and seed tests
npm run e2e            # browser tests against a fictitious test catalogue
```

## Costs

All of this is expected to run on free plans. **Check the current limits on each provider's pricing page**, because free tiers can change.

| Service | Plan | Notes |
|---|---|---|
| Cloudflare Pages | Free | Static hosting. The Free plan limits monthly builds |
| Sanity | Free | Separate project, so its quotas aren't shared with the main site. Check document, asset, bandwidth and API/CDN request limits |
| Images | Sanity CDN | Served resized (`?w=…&auto=format`) to keep bandwidth low |
| Domain | — | A subdomain of the existing domain costs nothing extra |
| WhatsApp Click to Chat | Free | Uses `wa.me` links, so no WhatsApp Business API is needed |
