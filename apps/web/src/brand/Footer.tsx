import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa'
import type { Settings } from '@bs/core'
import { footerExploreLinks, footerPolicyLinks, MAIN_SITE, socialLinks } from './links'

export default function Footer({ settings }: { settings?: Settings }) {
  const privacy = settings?.privacyNoticeUrl ?? `${MAIN_SITE}/privacy-policy`
  const email = settings?.contactEmail
  const whatsapp = settings ? `https://wa.me/${settings.whatsappNumber}` : null

  return (
    <footer className="bg-navy-footer px-6 pt-20 pb-10 text-cream">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-4">
          <div>
            <p className="logo-font mb-4 text-3xl">Beyond Scrumptious</p>
            <p className="mb-8 text-sm uppercase tracking-[0.2em] text-mist/70">
              Cakes • Desserts • Live Dessert Experiences
            </p>
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-mist/60">Explore</p>
            <ul className="space-y-3 text-sm text-cream/80">
              {footerExploreLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-mist/60">Policies</p>
            <ul className="space-y-3 text-sm text-cream/80">
              {footerPolicyLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={privacy} className="transition hover:text-white">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-mist/60">Harrow, London</p>
            {email && <p className="mb-6 text-sm text-cream/80">{email}</p>}
            <div className="flex gap-4 text-xl">
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition hover:text-mist">
                <FaInstagram />
              </a>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="transition hover:text-mist">
                  <FaWhatsapp />
                </a>
              )}
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition hover:text-mist">
                <FaTiktok />
              </a>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition hover:text-mist">
                <FaFacebook />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-cream/50 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Beyond Scrumptious. All rights reserved.</p>
          <p>Prices shown are estimates. Every enquiry is reviewed and confirmed by Beyond Scrumptious.</p>
        </div>
      </div>
    </footer>
  )
}
