/**
 * The single GROQ query the website runs. The projection renames Sanity
 * fields into the "raw" shape that `parseCatalogue` validates.
 *
 * `!(_id in path("drafts.**"))` is belt-and-braces: the client also requests
 * the `published` perspective, so drafts are never returned.
 */

const NOT_DRAFT = '!(_id in path("drafts.**"))'

const PRICING = `{
  mode,
  amountPence,
  "bySize": bySize[]{ "configurationId": configuration._ref, amountPence }
}`

const IMAGE = `{
  "url": image.asset->url,
  "width": image.asset->metadata.dimensions.width,
  "height": image.asset->metadata.dimensions.height,
  alt,
  caption,
  view,
  "labels": labels[]{ text, placement, x, y },
  "shownElements": shownElements[]{ description, status }
}`

const GROUP = `{
  includeAllActive,
  required,
  maxSelections,
  "choices": choices[]{ "optionId": option._ref, isDefault, "priceOverride": priceOverride${PRICING} }
}`

export const CATALOGUE_QUERY = `{
  "settings": *[_type == "cakeSiteSettings" && ${NOT_DRAFT}][0]{
    businessName, mainWebsiteUrl, whatsappNumber, contactEmail, currency, timezone,
    defaultLeadTimeDays, collectionInstructions, quotationDisclaimer, privacyNoticeUrl,
    customOrderUrl, customOrderCtaText, servingsNote, dessertPortionsHelp, coffeePortionsHelp, allergenInfoUrl, maintenanceNotice,
    builderEnabled
  },
  "categories": *[_type == "cakeCategory" && showOnWebsite != false && ${NOT_DRAFT}] | order(order asc) {
    "id": _id, name, "slug": slug.current, description, order
  },
  "configurations": *[_type == "cakeConfiguration" && ${NOT_DRAFT}] | order(order asc) {
    "id": _id, label, shape, sizeInches, tierCount, spongeLayers, approxHeightInches,
    dessertPortions{ min, max }, coffeePortions{ min, max },
    basePricePence, offeredByDefault, active, order
  },
  "options": *[_type in ["cakeFlavour", "cakeFilling", "cakeFrosting"] && ${NOT_DRAFT}] | order(order asc) {
    "id": _id,
    "kind": select(_type == "cakeFlavour" => "flavour", _type == "cakeFilling" => "filling", "frosting"),
    name, description, "pricing": pricing${PRICING}, dietaryNotes, active, order
  },
  "extras": *[_type == "cakeExtra" && ${NOT_DRAFT}] | order(order asc) {
    "id": _id, name, description, "pricing": pricing${PRICING},
    allowQuantity, minQuantity, maxQuantity, active, order
  },
  "decorations": *[_type == "cakeDecoration" && ${NOT_DRAFT}] | order(order asc) {
    "id": _id, name, customerLabel, description, "imageUrl": image.asset->url,
    "pricing": pricing${PRICING},
    defaultAppliesTo, "defaultCategoryIds": defaultCategories[]._ref, defaultStatus,
    "restrictToConfigurationIds": restrictToConfigurations[]._ref,
    "incompatibleWithIds": incompatibleWith[]._ref,
    "upgradeOfId": upgradeOf._ref,
    requiresName, requiresAge, active, order
  },
  "designs": *[_type == "cakeDesign" && showOnWebsite != false && defined(slug.current) && ${NOT_DRAFT}] | order(order asc) {
    "id": _id, name, "slug": slug.current, reference, "categoryId": category._ref,
    shortDescription, fullDescription, structureNotes,
    "mainImage": mainImage${IMAGE},
    "gallery": gallery[]${IMAGE},
    featured, order, acceptingEnquiries, leadTimeDaysOverride,
    useStandardConfigurations,
    "configurationOverrides": configurationOverrides[]{
      "configurationId": configuration._ref, action, basePriceOverridePence, note
    },
    "flavours": flavours${GROUP},
    "fillings": fillings${GROUP},
    "frostings": frostings${GROUP},
    "extras": extras[]{ "extraId": extra._ref, "priceOverride": priceOverride${PRICING} },
    inheritStandardDecorations,
    "decorationOverrides": decorationOverrides[]{
      "decorationId": decoration._ref, action, "priceOverride": priceOverride${PRICING},
      "restrictToConfigurationIds": restrictToConfigurations[]._ref, note
    },
    dietaryInfo, allergenInfo, showCustomCta, customPrompt
  }
}`
