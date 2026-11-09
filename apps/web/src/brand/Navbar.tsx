import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBars, FaTimes } from 'react-icons/fa'
import { mainNavLinks, MAIN_SITE } from './links'

export default function Navbar({ customOrderUrl }: { customOrderUrl?: string }) {
  const [open, setOpen] = useState(false)
  const quoteHref = customOrderUrl ?? `${MAIN_SITE}/contact`

  return (
    // Solid navy (the main site uses navy at 20% over a photo hero) so the light wordmark stays legible on this page's light background.
    <nav aria-label="Main" className="on-navy fixed top-0 left-0 z-50 w-full bg-navy/95 px-5 py-5 text-mist backdrop-blur-md md:px-12 md:py-6">
      <div className="flex items-center justify-between gap-4">
        <a href={MAIN_SITE} className="block shrink-0">
          <img src="/images/logo-mark-mist.png" alt="Beyond Scrumptious" width={474} height={480} className="h-10 w-auto md:h-12" />
        </a>

        <div className="hidden items-center gap-7 whitespace-nowrap text-sm uppercase tracking-[0.2em] text-mist/80 xl:flex">
          <Link to="/" aria-current="page" className="text-mist underline decoration-mist/50 underline-offset-8">
            Ready-to-Order
          </Link>
          {mainNavLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          ))}
          <a href={quoteHref} className="rounded-[2px] bg-mist px-6 py-3 text-navy transition hover:bg-surface">
            Request Your Quote
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center text-2xl text-mist xl:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="mt-5 flex flex-col gap-6 bg-navy p-6 text-sm uppercase tracking-[0.3em] text-mist/80 xl:hidden">
          <Link to="/" className="text-mist underline decoration-mist/50 underline-offset-8" onClick={() => setOpen(false)}>
            Ready-to-Order Cakes
          </Link>
          {mainNavLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a href={quoteHref} className="rounded-[2px] bg-mist px-6 py-4 text-center tracking-normal text-navy normal-case">
            Request Your Quote
          </a>
        </div>
      )}
    </nav>
  )
}
