import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBars, FaTimes } from 'react-icons/fa'
import { mainNavLinks, MAIN_SITE } from './links'

export default function Navbar({ customOrderUrl }: { customOrderUrl?: string }) {
  const [open, setOpen] = useState(false)
  const enquireHref = customOrderUrl ?? `${MAIN_SITE}/contact`

  return (
    <nav aria-label="Main" className="fixed top-0 left-0 z-50 w-full bg-navy/80 px-5 py-5 backdrop-blur-md md:px-12 md:py-6">
      <div className="flex items-center justify-between gap-4">
        <a href={MAIN_SITE} className="logo-font shrink-0 text-2xl text-cream md:text-4xl">
          Beyond Scrumptious
        </a>

        <div className="hidden items-center gap-6 whitespace-nowrap text-sm uppercase tracking-[0.2em] text-cream/80 xl:flex">
          <Link to="/" className="text-gold transition hover:text-gold-light">
            Ready-to-Order
          </Link>
          {mainNavLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          ))}
          <a
            href={enquireHref}
            className="rounded-full bg-cream px-6 py-3 text-navy transition hover:bg-mist"
          >
            Custom Enquiry
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center text-2xl text-cream xl:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="mt-5 flex flex-col gap-6 rounded-3xl bg-navy p-6 text-sm uppercase tracking-[0.3em] text-cream/80 xl:hidden"
        >
          <Link to="/" className="text-gold" onClick={() => setOpen(false)}>
            Ready-to-Order Cakes
          </Link>
          {mainNavLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a
            href={enquireHref}
            className="rounded-full bg-cream px-6 py-4 text-center tracking-normal text-navy normal-case"
          >
            Custom Cake Enquiry
          </a>
        </div>
      )}
    </nav>
  )
}
