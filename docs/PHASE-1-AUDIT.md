# Phase 1 — Audit, Architecture and Implementation Plan

**Project:** Beyond Scrumptious Ready-to-Order Cake Builder
**Target:** `https://cakes.beyondscrumptious.com/` (new, separate deployment)
**Status:** Draft for owner approval. No application code has been written yet.
**Audit date:** 25 October 2026

---

## 0. How this audit was carried out (and its limits)

| Source | Result |
|---|---|
| Live site `https://beyondscrumptious.com/` | **Not reachable from the build environment.** Its network policy blocks the host. No screenshots or live CSS could be taken. |
| Sanity API (`api.sanity.io`, `cdn.sanity.io`) | **Not reachable**, for the same reason. Existing CMS *content* was not inspected. Only the schema definitions were. |
| Source repo `BeyondScrumptiousDevelopment/websiteBS` (commit `7d67f46`, 22 Oct 2026) | **Fully inspected.** It is a Next.js site with Sanity and Cloudflare Pages config. It includes the current Diwali 2026 campaign, so it appears to be what is live. **The owner needs to confirm this.** |
| Repo `BeyondScrumptiousDevelopment/BeyondScrumptiousWebsite` (private, Sep 2026) | Contains only config files (`package.json`, `sanity.config.ts`, …) and no application source. It is treated as an older stub. |
| Official pricing pages (Sanity, Cloudflare, WhatsApp) | **Not reachable.** The free-tier limits in §9 have **not been verified** and must be checked before launch. |

So the design audit below comes from the **production source code**, not from what the browser renders. A visual check against the live site is still needed at the start of Phase 4. Either the environment's network allow-list must include `beyondscrumptious.com`, or the owner can supply screenshots.

---

## 1. Existing website — technical findings

| Item | Finding |
|---|---|
| Framework | Next.js **15.5.25** (pinned), React 19, TypeScript, Tailwind CSS **v4** |
| Hosting | Cloudflare Pages via `@cloudflare/next-on-pages`. Pages project name `websitebs` (`wrangler.toml`) |
| Canonical URL | `https://www.beyondscrumptious.com` (`metadataBase` in `app/layout.tsx`) |
| CMS | **Sanity project `8mwfu81d`, dataset `production`**. Public read with no token, `useCdn: false` |
| Studio | Deployed separately with the Sanity CLI (`npx sanity deploy`). Uses the `sanity-plugin-media` plugin |
| Existing schema types | `product` (despite its name, this is a **Gallery Image** with image, caption, category, featured, order) and `linksPage` (a singleton) |
| GROQ queries in the main site | Only `*[_type == "product" …]` and `*[_type == "linksPage"]` |
| Contact / enquiry | `/contact`, a Formspree form (`mrpbpyzd`). It has **no URL pre-fill support** |
| WhatsApp | Hard-coded `https://wa.me/447933903000`. Floating button bottom-right, plus a footer icon |
| Email | `hello@beyondscrumptious.com` |
| Policies | `/privacy-policy`, `/terms`, `/cookie-policy`, `/allergen-information`, `/delivery-collection` |
| Analytics | Google Analytics `G-YP8PFRH5ZN`, consent-gated (`components/Analytics.tsx`) |
| Motion | `framer-motion` with shared `Reveal`, `RevealGroup`, `TapLink`, `SectionSeam` and `MotionProvider`. Respects reduced motion |

### Implications for the cake builder

1. **The existing Sanity project can safely be reused.** The main site only queries `product` and `linksPage`. New document types with distinct names cannot appear on the main site.
2. **Naming collision.** The name `product` is already taken by gallery images. Every cake builder type will use a `cake` prefix (`cakeDesign`, `cakeConfiguration`, …). The existing types and documents will not be renamed, edited or migrated.
3. **The main site's deployment is untouched.** The cake builder will be a new Cloudflare Pages project with its own repo (`rto-beyond`), build and domain.
4. **Content messaging conflict.** The main `/cakes` page says designs are *"made to order, not picked from a fixed catalogue"*. Once the ready-to-order catalogue launches, the owner may want to update that copy. That is a main-site change and needs separate approval. Nothing here depends on it.
5. **Privacy policy.** It currently lists Formspree as the data processor. It does not mention enquiries sent through WhatsApp. The owner should review the policy (§7). I will not draft policy wording.

---

## 2. Design audit (from source)

### 2.1 Colour tokens

| Token (proposed name) | Hex | Where it is used |
|---|---|---|
| `navy` | `#202b45` | Primary page background, primary button text, mobile menu, WhatsApp button |
| `navy-deep` | `#161f36` | Cards on navy sections |
| `navy-footer` | `#171f34` | Footer background |
| `ink` | `#111111` | `body` base background |
| `cream` | `#f8f8f8` | Primary text on navy, primary button background |
| `mist` | `#cfd7e2` | Alternate light sections, button hover, form labels, eyebrows (at 60–70% opacity) |
| `slate` | `#8992a3` | Section seam lines, WhatsApp button hover |
| `gold` | `#c9973f` | Highlight accent (seasonal nav link, default seam colour) |
| `gold-light` | `#f3e3c3` | Gold hover |
| `whatsapp` | `#25D366` | WhatsApp CTA tint (`/10` background, `/30` border, solid icon) |
| `white` | `#ffffff` | Tiles on mist sections, inputs (`white/95`) |

Text on navy uses opacity steps of cream: `/80` for nav, `/70` for body copy and `/50` for fine print.

### 2.2 Typography

| Role | Font | Notes |
|---|---|---|
| Logo / wordmark | **KonTiki** (self-hosted `public/fonts/kontiki.ttf`, class `.logo-font`) | The logo is a **text wordmark** "Beyond Scrumptious", not an image. Sizes `text-3xl md:text-4xl` |
| Headings | **Playfair Display** (Google Fonts, `--font-heading`, class `.heading-font`) | H1 `text-5xl md:text-8xl`; H2 `text-4xl md:text-6xl`; card H3 `text-3xl` |
| Body | Arial, Helvetica, sans-serif | Body copy `text-lg md:text-xl leading-8` |
| Eyebrow | Body font | `uppercase tracking-[0.4em] text-sm text-mist/70` |
| Nav / labels | Body font | `uppercase tracking-[0.2em] text-sm`; form labels `tracking-[0.15em]` |

The cake builder will copy `kontiki.ttf` into its own `public/fonts/`, and the owner should confirm the font licence covers the subdomain. Playfair Display will load from Google Fonts.

### 2.3 Components and patterns

- **Header.** Fixed, `backdrop-blur-md bg-navy/20`, padding `px-8 md:px-12 py-8`. KonTiki wordmark on the left. Uppercase tracked links on desktop, with a pill CTA (`rounded-full bg-cream text-navy px-6 py-3`, hover `bg-mist`). On mobile, a hamburger with an animated icon swap opens a `rounded-3xl bg-navy p-6` dropdown.
- **Buttons.**
  - Primary: `rounded-full bg-cream text-navy px-10 py-5 text-sm uppercase tracking-[0.2em] hover:bg-mist`.
  - Secondary: `rounded-full border border-cream/30 hover:bg-cream/10`.
  - Tap feedback: scale 0.96.
- **Section rhythm.** Navy sections and mist (`#cfd7e2`, navy text) sections alternate. Vertical padding is `py-28`, content width `max-w-5xl` / `max-w-6xl`. A `SectionSeam` (a 128 px slate line that draws in) separates sections.
- **Cards.** `rounded-[2rem] p-10 shadow-xl bg-navy-deep` on navy. White `rounded-2xl shadow-md` tiles on mist (the flavour grid).
- **Image / gallery.** `rounded-[2rem] overflow-hidden shadow-2xl bg-black`, `aspect-[4/3] md:aspect-[16/9]`, `object-contain`. Images cross-fade (700 ms) with pill dot indicators.
- **Forms.** Inputs use `rounded-xl bg-white/95 text-navy px-5 py-4`, with focus `ring-2 ring-navy/30`. Labels are `uppercase tracking-[0.15em] text-sm text-mist`. Choice chips are `rounded-xl` bordered toggles in a 2- or 3-column grid.
- **Footer.** `bg-navy-footer pt-24 pb-10`, in four columns: wordmark + tagline + CTA / Explore / Policies / location, email and social icons. Copyright row beneath.
- **Floating WhatsApp button.** Fixed bottom-right, navy circle, pulsing ring.
- **Motion.** Fade-up reveal on scroll (0.5 s, ease `[0.21,0.47,0.32,0.98]`). Reduced motion is respected.
- **Icons.** `react-icons/fa` (Font Awesome) and `lucide-react`.

### 2.4 Design-continuity plan

The cake builder will **port, not reinvent**:

- The same Tailwind v4 utility classes and the colour tokens above, defined once in a `@theme` block.
- Ports of `Navbar`, `Footer`, `Reveal`/`TapLink`/`SectionSeam` and the gallery slideshow, with Next.js-specific APIs replaced by plain React.
- Nav links pointing back to `https://www.beyondscrumptious.com/...`, so the subdomain feels like part of the same site.
- The configurator's new controls (option cards, price summary, steps) built from the existing primitives: rounded-xl chips, navy-deep cards and pill buttons.
- No component library.

---

## 3. Recommended architecture

### 3.1 Decisions

| Decision | Recommendation | Reason |
|---|---|---|
| Frontend | **React + TypeScript + Vite**, static SPA | As specified. Nothing in the audit argues against it. The configurator is interactive and does not depend on SEO, so a static build on Cloudflare Pages needs no Functions or Workers and stays within the free tier. The main site's components port easily. |
| Hosting | **New Cloudflare Pages project** (e.g. `bs-cakes`) connected to `rto-beyond` | Completely separate from the `websitebs` project. It gets a `*.pages.dev` staging URL first. The custom domain is attached only after approval. |
| Domain | `cakes` CNAME added via *Pages → Custom domains* | This adds one DNS record and does not touch apex, `www`, MX or other records. It assumes the zone is on Cloudflare, which needs confirming in the dashboard. |
| CMS project | **Reuse Sanity project `8mwfu81d`** | One account, one media library, no duplicate assets. Safe because types are namespaced (§1). |
| Dataset | **Reuse `production`**, using only `cake*` types | Assets such as existing gallery photos can be reused. The main site cannot see the new types. The alternative, a separate `cakes` dataset, isolates content more strongly but splits the media library. |
| Studio | **Option A (recommended): a separate "Cakes" Studio deployed from this repo**, same project and dataset, its own hosted URL | No changes to the main site's repo. **Option B:** add the cake schemas to the existing Studio in `websiteBS`. That gives the owner one Studio, but it is a change to the main site's repo and needs explicit approval. |
| Data fetching | Runtime GROQ fetch from the browser via Sanity's **API CDN**, published perspective only, no token | Published changes appear without a rebuild. With no token, drafts are never exposed. Requires `https://cakes.beyondscrumptious.com` and the staging origin to be added to Sanity's CORS origins, without credentials. |
| Validation | **zod** schemas validate every catalogue response at runtime | Invalid or partial data blocks quoting with a clear message. The site never falls back to stale prices. |
| Core logic | A pure TypeScript package with **no React or Sanity dependencies** | Pricing, decoration resolution, dates and WhatsApp formatting can be unit-tested in isolation. |
| State | Selections kept in the **URL query string** (IDs only). Customer details only in React state | A refresh or a WhatsApp failure does not lose the cake. Personal data is never persisted to storage or URLs. |
| Analytics | **None in v1** | Matches the "no unnecessary tracking" requirement. GA can be added later with the same consent banner if the owner wants it. |

### 3.2 Folder structure (npm workspaces)

```
rto-beyond/
├─ docs/
│  ├─ PHASE-1-AUDIT.md          ← this document
│  ├─ CMS-GUIDE.md              (Phase 8: owner's guide)
│  └─ DEPLOYMENT.md             (Phase 7)
├─ packages/
│  └─ core/                     pure TS, no framework
│     ├─ src/
│     │  ├─ catalogue/          zod schemas + normalisation of Sanity data
│     │  ├─ decorations/        default inheritance + override resolution
│     │  ├─ pricing/            estimate engine (integer pence)
│     │  ├─ dates/              Europe/London lead-time validation
│     │  ├─ enquiry/            WhatsApp message + wa.me URL builder
│     │  └─ money.ts            pence ↔ GBP formatting
│     └─ test/                  Vitest + fixture catalogues (clearly fake data)
├─ apps/
│  └─ web/                      Vite + React + Tailwind v4
│     ├─ public/fonts/kontiki.ttf
│     ├─ src/
│     │  ├─ brand/              ported Navbar, Footer, motion helpers, tokens
│     │  ├─ catalogue/          catalogue list, design cards
│     │  ├─ design/             gallery, image labels/annotations, structure panel
│     │  ├─ builder/            step components, price summary
│     │  ├─ enquiry/            details form, review, disclaimer, WhatsApp/copy
│     │  └─ sanity/             client, GROQ queries, image URL builder
│     └─ e2e/                   Playwright (desktop + iPhone + Pixel profiles)
├─ studio/                      Sanity Studio (cake types only)
│  ├─ schemaTypes/
│  ├─ structure.ts              owner-friendly desk (see §4.8)
│  └─ sanity.config.ts
└─ package.json                 workspaces, shared scripts
```

---

## 4. Sanity content model (proposed)

Every type is prefixed `cake` to avoid colliding with the main site. **All prices are integers in pence.** Every document has `active` (or `published`) plus `order` fields, and Sanity's draft/publish workflow controls what is public.

### 4.1 `cakeSiteSettings` (singleton)

`businessName`, `mainWebsiteUrl`, `cakeBuilderUrl`, `whatsappNumber` (E.164 digits, validated), `contactEmail`, `currency` (fixed `GBP`), `timezone` (fixed `Europe/London`), `defaultLeadTimeDays` (initial `7`), `collectionInstructions` (rich text), `quotationDisclaimer` (seeded with the mandatory wording from spec §12.1, see §6), `privacyNoticeUrl`, `customOrderUrl`, `customOrderCtaText`, `maintenanceNotice` (optional; when set, quoting is paused), `builderEnabled` (boolean kill-switch).

### 4.2 `cakeCategory`

`name`, `slug`, `description`, `image?`, `order`, `published`.

### 4.3 `cakeConfiguration` (a reusable size/structure)

| Field | Notes |
|---|---|
| `label` | e.g. the owner's own "6-inch, two layers" |
| `shape` | round / square / other (owner-defined list) |
| `diameterInches` / `dimensionsText` | Whichever the owner approves |
| `tierCount` | Integer, **separate from** sponge layers |
| `spongeLayersPerTier` | Integer |
| `fillingLayersPerTier` | Optional |
| `approxHeightInches` | Optional, shown only if set |
| `servingGuidance` | Optional, owner-approved text only |
| `basePricePence` | Required, > 0 |
| `active` | |

**Design note.** Spec §9.4 puts the product references on the configuration, while §9.3 puts configuration references on the product. Storing both would let them disagree. I recommend **storing the link on the product only**, as `cakeDesign.offeredConfigurations[]`. Each configuration's Studio view then shows a read-only "used by designs" list, so the owner gets both views from one source of truth.

### 4.4 Reusable options: `cakeFlavour`, `cakeFilling`, `cakeFrosting`, `cakeExtra`

Common fields: `name`, `description`, `image?`, `active`, `order`, `dietaryNotes?` (owner-approved), and a shared **`pricingRule`** object:

```
pricingRule:
  mode: 'included' | 'fixed' | 'bySize'
  amountPence?: int            (mode = fixed)
  bySize?: [{ configuration → cakeConfiguration, amountPence }]   (mode = bySize)
```

`bySize` allows a premium flavour to cost more on a larger cake without duplicate records. A `bySize` rule with no entry for the selected configuration is treated as **unpriced**: the option is unavailable for that size and is never shown as free.

`cakeExtra` adds `quantity: { allowed: bool, min, max }`, which gives a per-unit price, and `requiresCustomerText` (e.g. a pre-defined, priced message plaque).

### 4.5 `cakeDecoration` (the central decoration library)

| Field | Purpose |
|---|---|
| `name`, `customerLabel?`, `description`, `image?`, `notes?` | |
| `pricingRule` | Same object as §4.4. This is the **default** price |
| `active` | When false, the decoration is disabled everywhere, overriding all product settings |
| **`defaultRule.appliesTo`** | `none` / `allDesigns` / `categories` |
| `defaultRule.categories[]` | When `appliesTo = categories` |
| **`defaultRule.status`** | `included` (part of the base price) or `optional` (a paid add-on offered automatically) |
| `restrictToConfigurations[]` | Optional: only valid on these sizes |
| `incompatibleWith[]` | Other decorations that cannot be combined with it |
| `upgradeOf?` | Points to another decoration this one **replaces**. Its price is the upgrade charge (see §5.2) |
| `order` | |

Keeping the default rule on the decoration document means each decoration has exactly one record. Its price and default reach every design that inherits it.

### 4.6 `cakeDesign` (the cake product)

| Group | Fields |
|---|---|
| Basics | `name`, `slug`, `designReference` (short code for WhatsApp, e.g. owner-chosen), `category →`, `shortDescription`, `fullDescription` (rich text), `featured`, `order`, `published` |
| Photos | `mainImage`, `gallery[]`. Each image is a **`cakeImage`** object (§4.7) |
| Structure | `structureNotes` (rich text), plus the structural fields on each configuration |
| Configurations | `offeredConfigurations[]`: `{ configuration →, basePriceOverridePence?, note? }` (at least one required) |
| Options | `flavours[]`, `fillings[]`, `frostings[]`, `extras[]`. Each entry is `{ option →, isDefault?, priceOverride? (pricingRule) }`. Single-choice vs required is set per group (`flavourRule: { required, maxSelections }`) |
| Decorations | `inheritStandardDecorations` (default `true`), plus `decorationOverrides[]`: `{ decoration →, action: 'include' / 'optional' / 'exclude', priceOverride?, restrictToConfigurations?[], note? }` |
| Rules | `leadTimeDaysOverride?`, `acceptingEnquiries` (boolean, so a design can be paused without being unpublished) |
| Approved info | `dietaryInfo` (e.g. eggless; vegan **only if set per product**), `allergenInfo` (owner-approved text), with a link to the main site's allergen page |
| Custom routing | `customRouting: { showCustomCta (default true), customPrompt? (text), allowReferenceForCustom (default true) }` |

Studio validation blocks:

- the same decoration appearing twice in `decorationOverrides`;
- an option referenced that is inactive or unpublished, shown as a warning;
- a design with no priced configuration.

### 4.7 `cakeImage` (object) — photographs and structural labels

```
cakeImage:
  image (hotspot), alt (required), caption?
  view: 'main' | 'side' | 'top' | 'crossSection' | 'detail' | 'other'
  labels[]: { text, placement: 'beside' | 'overlay', x?, y? (0–100 %, overlay only), pointer? }
  showsOptionalElements[]: { description, status: 'included' | 'paidOption' | 'customExample', decoration →? }
```

- **`beside` labels** render as a list under the photo, which is always readable on mobile.
- **`overlay` labels** are numbered callout dots, matched to the list underneath. They never draw text across the photo, so on small screens the cake stays visible.
- **`showsOptionalElements`** meets spec §6.4. Any element in the photo that is not included in the base price is listed as, for example, "Shown: gold drip — paid option" or "Shown: custom topper — example of a custom order".

### 4.8 Studio structure (answers §7.5)

The custom desk structure will offer:

- **Settings** (the singleton);
- **Designs** (by category);
- **Sizes and structures**;
- **Options** (flavours, fillings, frostings, extras);
- **Decorations**, with filtered lists:
  - *Included by default*
  - *Offered by default (paid)*
  - *Not applied by default*
  - *Disabled*
- **Decoration overview**: a per-decoration panel listing which designs inherit it, which override it (and how), and the resulting status per design. It is computed with the same resolution code as the website, so the Studio and the site cannot disagree.

Previews show price (£), status and active state at a glance.

---

## 5. Pricing engine design

### 5.1 Inputs and outputs

```
estimate(catalogue, selection) →
  | { ok: true,  lines: Line[], includedItems: Item[], totalPence, warnings[] }
  | { ok: false, errors: ValidationError[] }   // nothing priced, nothing sent
```

`selection` holds IDs only, such as `designSlug`, `configurationId`, `flavourIds`, `decorationIds` and `extras` with quantities. It never contains a price. Every price is looked up from validated catalogue data.

### 5.2 Decoration resolution (deterministic, in order)

1. **Inherit.** If `inheritStandardDecorations` is true, take every decoration where `defaultRule.appliesTo = allDesigns`, or `categories` includes the design's category. Each starts with its default `status` and default `pricingRule`.
2. **Override.** Apply each `decorationOverrides[]` entry, keyed by decoration ID:
   - `exclude` removes it;
   - `include` or `optional` adds it or changes its status;
   - `priceOverride` replaces its price;
   - `restrictToConfigurations` narrows its sizes.
3. **Filter.** Drop decorations that are inactive (global kill wins), restricted to other configurations, or unpriced for the selected size when `optional`.
4. **Upgrades.** A selected decoration with `upgradeOf = X` **replaces** X in the included list and charges its own upgrade price. X is never charged.
5. **Dedupe.** The result is a map keyed by decoration ID, so one decoration has one line. If the customer selects an `included` decoration, it is shown as "Included" and charged £0.
6. **Compatibility.** If any selected pair is listed in `incompatibleWith`, that is a validation error.

### 5.3 Total

```
total = configuration base price (product override if set)
      + Σ paid flavour / filling / frosting upgrades
      + Σ chargeable optional decorations (after upgrade replacement)
      + Σ extras × quantity
```

All arithmetic uses integers in pence. Output is formatted with `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`.

### 5.4 Validation errors (each blocks the quote, with a customer-facing message)

The engine returns a validation error when:

- the design is missing, unpublished or not accepting enquiries;
- the configuration is not offered for this design, inactive or unpriced;
- an option is not offered for this design, inactive, or unpriced for this size;
- a required group is not selected, or a group has too many selections;
- decorations are incompatible;
- an extra's quantity is out of range;
- catalogue data fails schema validation;
- the builder is disabled or in maintenance.

---

## 6. Dates, custom routing and the WhatsApp enquiry

**Lead time.**

- `today` is the current calendar date **in Europe/London**, derived with `Intl.DateTimeFormat`.
- The requested date is a plain calendar date (`YYYY-MM-DD`). The rule is `requested ≥ today + leadDays`, where `leadDays` is the design override if set, otherwise the site default.
- Because the comparison is between calendar dates, not timestamps, BST/GMT transitions cannot shift the result.
- Time is optional, `HH:mm`, and is only passed through to the message.
- Every date screen shows: *"Meeting the minimum notice does not mean the date is available — every date is subject to confirmation."*

**Custom routing.**

- Every design page and the review step show *"Looking for something different? Request a custom cake."*
- The CTA links to `customOrderUrl` from Settings. The **verified existing destination** is `https://www.beyondscrumptious.com/contact`. It cannot be pre-filled, so the CTA will also offer *"Ask on WhatsApp instead"*, with a message that names the chosen design as a reference.
- Free-text notes are **never priced**. If the customer ticks *"My request includes something not listed"*, the enquiry is labelled `CUSTOM REQUEST — NOT INCLUDED IN ESTIMATE (to be quoted by Beyond Scrumptious)`, and the estimate is labelled *"ready-to-order items only"*.

**WhatsApp.**

- The URL is `https://wa.me/<settings.whatsappNumber>?text=<encodeURIComponent(message)>`.
- The message follows the structure in spec §12.3. It includes the design reference and a catalogue timestamp, so the owner can check prices against Studio.
- The mandatory disclaimer (spec §12.1) is:
  - shown verbatim in a prominent panel on the review screen and directly above the CTA;
  - included in the message itself.
- The CTA text is **"Send Cake Enquiry via WhatsApp"**.
- The page does not claim the message was sent. After the CTA it says *"WhatsApp should now open with your message — please press send in WhatsApp."*
- A **Copy enquiry** button (Clipboard API, with a select-text fallback) is always available.
- An automated test scans all UI copy for banned phrases such as "confirm order", "place order", "book my cake", "complete purchase", "pay now" and "order confirmed".

---

## 7. Privacy and security

- **No Sanity tokens in the frontend.** The site reads only published data.
- **Customer details are never written to Sanity, storage, URLs or analytics.** They exist in memory until the tab closes and leave the device only when the customer presses send in WhatsApp.
- **The catalogue is public by design.** Nothing private is stored in it.
- **CORS** is limited to the cake builder's origins.
- A **CSP** (`_headers` file on Pages) restricts connections to `*.sanity.io` / `cdn.sanity.io`, Google Fonts and `wa.me`.
- **The owner should review the privacy policy.** It should cover customer details sent via WhatsApp from the cake builder. The footer and enquiry form will link to `privacyNoticeUrl`.

---

## 8. Testing strategy

| Layer | Tool | Coverage |
|---|---|---|
| Core unit | Vitest | All of spec §17: pricing, inheritance, overrides, dedupe, upgrades, unpriced/inactive cases, date edges (including the last-Sunday-of-March and October BST changes, and month/year rollover), WhatsApp encoding and content, and the disclaimer's presence |
| Catalogue | Vitest + zod | Published/unpublished filtering, missing images, multiple gallery images, labels, missing structural fields, dangling references |
| Studio | Vitest | Schema validation rules (duplicate overrides, missing prices) |
| End-to-end | Playwright (Chromium, plus desktop, iPhone and Pixel viewports) | Full journey against a **fixture catalogue** served by intercepting the Sanity request, including the outage path, the copy fallback and the banned-wording scan |

All fixtures are **clearly fictitious** (for example "Test Design A", "£10.00"). Real catalogue data comes only from the owner via Studio.

---

## 9. Costs (to be verified, see §0)

| Item | Expected cost | Notes and what to verify |
|---|---|---|
| Cloudflare Pages (static) | £0 on the Free plan | Check the monthly build limit and concurrent builds. A static site uses no Functions |
| Sanity | £0 on the Free plan | **It shares quotas with the main site**: documents, assets, API and CDN requests, bandwidth. The main site uses `useCdn: false`, which counts against API (not CDN) requests. Check current Free-plan limits, and whether a second hosted Studio is allowed on Free (Option A, §3.1). If it is not, use Option B or host the Studio at a `/studio` path |
| Image delivery | Included in Sanity bandwidth | Responsive `?w=&auto=format` URLs keep transfer small |
| Domain | £0 extra | A subdomain of the existing domain |
| WhatsApp Click to Chat | £0 | No API, no Business Platform account needed |
| Paid services | None proposed | |

Free tiers are not unlimited and may change. Usage will be reviewed on the Sanity and Cloudflare dashboards after launch.

---

## 10. Implementation plan

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **1. Audit** (this doc) | Audit, architecture, schema, plan | **Owner approves** this document and answers §11 |
| 2. CMS | `studio/` with all `cake*` schemas, validation, desk structure, decoration overview. Deployed to a staging Studio | The owner can create a test design end-to-end without code. The main site's Studio and content are unchanged |
| 3. Pricing engine | `packages/core` and its full test suite | All §17 pricing, decoration and date tests pass |
| 4. Customer website | Catalogue, design page, gallery and labels, guided steps, live estimate, all in the ported brand shell | Visual check against the live site signed off by the owner |
| 5. Custom routing | CTA, custom-request flagging, WhatsApp reference flow | No path assigns a price to a custom request |
| 6. WhatsApp | Review screen, disclaimer, message, copy fallback | Message snapshot tests pass, plus a manual check on iOS and Android |
| 7. Test & deploy | e2e suite, `*.pages.dev` staging | **Owner approves staging**, then and only then is `cakes.beyondscrumptious.com` attached |
| 8. Handover | `CMS-GUIDE.md`, `DEPLOYMENT.md`, source, tests | |

Publishing latency: the site reads Sanity's API CDN at runtime, so a published change should appear on the next page load. That is expected to take seconds to about a minute and will be measured on staging in Phase 7. No rebuild is needed.

---

## 11. Decisions needed from the owner before Phase 2

1. **CMS reuse.** Do you approve adding `cake*` document types to Sanity project `8mwfu81d`, dataset `production`? Existing documents and types will not be modified.
2. **Studio location.** Which do you prefer?
   - **A (recommended):** a separate Cakes Studio deployed from this repo.
   - **B:** add the cake schemas to the existing Studio in `websiteBS`, which is a change to the main site's repo.
3. **WhatsApp number.** Is **+44 7933 903000**, the number used on the main site, the destination for cake enquiries? It will be entered in Settings, not in code.
4. **Custom order destination.** Is `https://www.beyondscrumptious.com/contact` correct? Should we also offer the WhatsApp custom-request route?
5. **Main-site confirmation.** Is `websiteBS` (`main` branch) what is live today? Is the DNS zone for `beyondscrumptious.com` on Cloudflare?
6. **Fonts.** Does the KonTiki font licence cover use on the subdomain?
7. **Analytics.** Should the cake builder have no analytics in v1 (recommended), or should it reuse the consent-gated GA?
8. **Copy and policy.** Should the main `/cakes` page and the privacy policy be updated later? This is your decision and wording, as a separate main-site change.
9. **Catalogue content.** For the first designs, please supply the real names, photos, sizes, structures, prices, options and decorations. Until then, only clearly fake test data will be used, on staging only.
10. **Environment access.** Optionally, allow `beyondscrumptious.com` and `*.sanity.io` in this development environment's network settings. That allows a visual audit of the live site and Studio verification.
