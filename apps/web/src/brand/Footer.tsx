import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa'
import type { Settings } from '@bs/core'
import { footerExploreLinks, footerPolicyLinks, MAIN_SITE, socialLinks } from './links'
import { BrandPiping } from './patterns'

export default function Footer({ settings }: { settings?: Settings }) {
  const privacy = settings?.privacyNoticeUrl ?? `${MAIN_SITE}/privacy-policy`
  const email = settings?.contactEmail
  const whatsapp = settings ? `https://wa.me/${settings.whatsappNumber}` : null

  return (
    <footer className="relative bg-surface px-6 pt-0 pb-10 text-navy">
      <BrandPiping />
      <div className="mx-auto max-w-7xl pt-20">
        <div className="grid gap-12 border-b border-navy/10 pb-14 md:grid-cols-4">
          <div>
            <img src="/images/logo-navy.png" alt="Beyond Scrumptious" className="mb-4 h-8 w-auto" />
            <p className="mb-8 text-sm uppercase tracking-[0.2em] text-slate">
              Cakes • Desserts • Live Dessert Experiences
            </p>
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-slate">Explore</p>
            <ul className="space-y-3 text-sm text-navy/80">
              {footerExploreLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-navy">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-slate">Policies</p>
            <ul className="space-y-3 text-sm text-navy/80">
              {footerPolicyLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-navy">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={privacy} className="transition hover:text-navy">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-slate">Harrow, London</p>
            {email && <p className="mb-6 text-sm text-navy/80">{email}</p>}
            <div className="flex gap-4 text-xl">
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition hover:text-slate">
                <FaInstagram />
              </a>
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="transition hover:text-slate">
                  <FaWhatsapp />
                </a>
              )}
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition hover:text-slate">
                <FaTiktok />
              </a>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition hover:text-slate">
                <FaFacebook />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-navy/70 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Beyond Scrumptious. All rights reserved.</p>
          <p>Prices shown are estimates. Every enquiry is reviewed and confirmed by Beyond Scrumptious.</p>
        </div>
      </div>
    </footer>
  )
}
