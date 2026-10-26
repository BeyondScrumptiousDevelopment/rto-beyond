# Managing the cake builder in Sanity Studio

Open the Cakes Studio at `https://beyondscrumptious-cakes.sanity.studio`, or whatever hostname was chosen at deploy time. Changes only reach customers after you press **Publish**.

## Prices are in pence

Every price box takes **whole pence**: `800` = £8, `1550` = £15.50, `14500` = £145. The list previews show the price in pounds, so you can check it.

## The menu

| Section | What it's for |
|---|---|
| **Settings** | WhatsApp number, minimum notice (default 7 days), the disclaimer, servings wording, custom-order link, and the switch to pause all enquiries |
| **Cake Designs** | Each design customers can choose |
| **Categories** | Optional groupings for the catalogue filter |
| **Sizes & Layers** | Each size, its layers, portions and **base price** |
| **Sponge Flavours / Fillings / Frostings** | The option libraries |
| **Extras** | Other paid add-ons. Can have a quantity, e.g. candles |
| **Decorations** | The central decoration library, plus an **overview** of which designs get which decoration |

## Adding a new cake design

1. **Cake Designs → +**.
2. **Basics:** name, click *Generate* for the web address, a short **design reference** (it appears in enquiries, e.g. `BS-DRIP-01`), and a short description.
3. **Photos:** add the main photo, plus side, top, cross-section or detail photos.
   - Always fill in **Alternative text**.
   - **Labels** are optional short facts, e.g. "Two sponge layers". *Beside* labels list under the photo. *On the photo* labels show a numbered marker at the position you give, as a % from the left and top.
   - If a photo shows something **not in the standard price** (a paid decoration, or a one-off custom piece), list it under *Items shown that are NOT in the standard price*.
4. **Sizes:** leave *Offer the standard size range* on. Use *Size changes* only for differences, such as removing a size from this design or giving it a different price.
5. **Flavours & extras:** by default every active flavour, filling and frosting is offered. Add specific entries only to pre-select one or to set a different price on this design. Add any extras this design offers.
6. **Decorations:** leave *Use the standard decorations* on. Use *Decoration changes* only for differences (see below).
7. **Rules & info:** minimum notice for this design if it differs from the default, approved dietary and allergen wording, and whether to show the custom-cake link.
8. **Publish.**

To hide a design, turn off *Show on website*. To keep it visible but stop enquiries, turn off *Accepting enquiries*.

## Sizes, layers and tiers

- **Sponge layers** and **tiers** are separate fields. A normal cake is **1 tier** with 2, 3 or 4 sponge layers.
- The starting data comes from your size table: 6" round 3 and 4 layers, and 8" round 2, 3 and 4 layers, with dessert and coffee portions.
- **6" square (3 and 4 layers) has no price yet and is switched off.** Add the base price, turn on *Active* and publish.
- **6" round 2 layers (£55)** is loaded but switched off, because it wasn't in your list of sizes for all cakes. Turn it on if you want to offer it.
- A size without a price is never shown to customers.

## Decorations: set once, override per design

Each decoration is a single record. Its **Default rule** says which designs get it automatically:

- **All designs**, **designs in particular categories** or **none**; and
- on those designs, whether it's **Included in the base price** or an **Optional paid add-on**.

Change the price on the decoration, and every design that inherits it updates. Designs with their own price override keep theirs.

On a design, **Decoration changes** let you:

- **Included in the base price**: add a decoration as part of this design's price.
- **An optional paid add-on**: offer it on this design, optionally at a different price.
- **Not available**: remove a standard decoration from this design.
- Limit it to certain sizes, and leave a note.

Other rules:

- **Upgrades:** set *This is an upgrade of…* on a decoration (e.g. a premium topper that replaces an included one). Its price is the upgrade charge, and the included item is never charged twice.
- **Can't be combined with:** stops customers choosing two decorations together.
- **Disabled** decorations (*Active* off) disappear from every design, whatever the design says.
- **Customer must enter a name / an age:** the customer is asked for the text, and it appears in the enquiry.

**Decorations → Overview: which designs get what** shows, for every decoration and design, whether it's included, optional (and at what price) or absent, and whether that comes from the default or a design override. It also lists anything customers can't see because something is missing, such as a price.

The starting toppers are all **optional add-ons on every design**:

| Topper | Price | Asks for |
|---|---|---|
| Card topper | £8 | — |
| Acrylic topper | £15 | — |
| Name charm (card) | £5 | name |
| Name charm (acrylic) | £8 | name |
| Name and age topper (card) | £9 | name and age |
| Name and age topper (acrylic) | £15 | name and age |

## Flavours

The starting flavours were copied from the flavour list on beyondscrumptious.com/cakes, all as **Included (no extra charge)**. If any are premium, open the flavour and set *Fixed price* to the extra charge, or *Price depends on the cake size* if the charge varies by size. Add fillings and frostings the same way.

## Custom orders

Anything outside the catalogue is never priced by the site: new designs, extra images, characters or logos, unlisted decorations, other sizes. Customers are sent to the **Custom order enquiry URL** in Settings (currently the main site's contact page) or offered a WhatsApp message. If a customer ticks "My request includes something not listed", the enquiry is labelled **CUSTOM REQUEST — NOT INCLUDED IN ESTIMATE**.

## Enquiries

Enquiries arrive as WhatsApp messages that the customer sends themselves. Nothing is stored on the website or in Sanity. Each message includes the design reference, the selections, the requested date (marked as not confirmed), the estimate and the date of the catalogue prices, so you can check them before confirming. **Nothing is confirmed until you confirm it.**
