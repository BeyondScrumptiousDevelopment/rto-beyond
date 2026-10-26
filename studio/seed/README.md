# Starter catalogue

`catalogue.ndjson` loads the starting data into a new, empty dataset:

```bash
cd studio
npx sanity dataset import seed/catalogue.ndjson production
```

It contains:

| Data | Source |
|---|---|
| Settings (WhatsApp +44 7933 903000, 7-day notice, disclaimer, links to the main site's contact, privacy and allergen pages) | Confirmed by the owner, Oct 2026 |
| Sizes and prices: 6" round 3/4 layers, 8" round 2/3/4 layers, with dessert and coffee portions | Owner's "Cake Sizes & Servings" table |
| 6" round 2 layers (£55) | In the owner's table but not in the "all cakes" list, so **inactive**. Switch it on to offer it |
| 6" square 3/4 layers | **No price supplied, so inactive.** Add the price and switch on |
| Toppers: card £8, acrylic £15, name charm card £5 / acrylic £8, name and age card £9 / acrylic £15 | Owner, Oct 2026. Optional paid add-ons on every design |
| Sponge flavours (included, no surcharge) | Copied from the flavour list on beyondscrumptious.com/cakes. **Check them and set a price on any premium flavour** |

Not included, so add them in Studio: cake designs and photos, categories, fillings, frostings and extras.

Re-running the import fails on documents that already exist. Use `--replace` only if you mean to overwrite edits made in Studio.
