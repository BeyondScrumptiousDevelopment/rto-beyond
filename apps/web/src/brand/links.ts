/**
 * Links back to the main website, mirroring its navigation and footer
 * (websiteBS components/Navbar.tsx and Footer.tsx). These are site
 * structure, not catalogue data. Contact details and policy URLs that the
 * owner manages come from Sanity settings where available.
 */
export const MAIN_SITE = 'https://www.beyondscrumptious.com'

export const mainNavLinks = [
  { href: `${MAIN_SITE}/cakes`, label: 'Cakes' },
  { href: `${MAIN_SITE}/desserts`, label: 'Desserts' },
  { href: `${MAIN_SITE}/gallery`, label: 'Gallery' },
  { href: `${MAIN_SITE}/our-story`, label: 'Our Story' },
  { href: `${MAIN_SITE}/faq`, label: 'FAQ' },
]

export const footerExploreLinks = [
  { href: MAIN_SITE, label: 'Main website' },
  { href: `${MAIN_SITE}/cakes`, label: 'Cakes' },
  { href: `${MAIN_SITE}/desserts`, label: 'Desserts & Dessert Tables' },
  { href: `${MAIN_SITE}/live-desserts`, label: 'Live Desserts' },
  { href: `${MAIN_SITE}/gallery`, label: 'Gallery' },
  { href: `${MAIN_SITE}/faq`, label: 'FAQ' },
]

export const footerPolicyLinks = [
  { href: `${MAIN_SITE}/allergen-information`, label: 'Allergen Information' },
  { href: `${MAIN_SITE}/delivery-collection`, label: 'Delivery & Collection' },
  { href: `${MAIN_SITE}/terms`, label: 'Terms & Conditions' },
  { href: `${MAIN_SITE}/cookie-policy`, label: 'Cookie Policy' },
]

export const socialLinks = {
  instagram: 'https://instagram.com/beyond.scrumptious',
  tiktok: 'https://www.tiktok.com/@beyondscrumptious',
  facebook: 'https://www.facebook.com/profile.php?id=61578473547436',
}
