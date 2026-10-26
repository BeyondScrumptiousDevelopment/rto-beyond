import { btnPrimary } from '../brand/ui'

export function Loading({ label = 'Loading the cake catalogue…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 pt-32" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-6 text-mist/80">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-mist/30 border-t-cream motion-reduce:animate-none" aria-hidden />
        <p>{label}</p>
      </div>
    </div>
  )
}

/** Shown when the catalogue can't be loaded. No prices are shown in this state. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 pt-32 pb-20">
      <div role="alert" className="max-w-xl text-center">
        <h1 className="heading-font mb-6 text-4xl">Sorry — the catalogue isn't available</h1>
        <p className="mb-4 leading-8 text-cream/70">{message}</p>
        <p className="mb-10 text-sm text-cream/50">
          To keep estimates accurate, we don't show prices unless the latest catalogue has loaded.
        </p>
        <button type="button" onClick={onRetry} className={btnPrimary}>
          Try again
        </button>
      </div>
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'warning'; children: React.ReactNode }) {
  const styles = {
    info: 'border-mist/30 bg-white/5 text-cream/80',
    warning: 'border-gold/60 bg-gold/10 text-gold-light',
    error: 'border-alert/60 bg-alert/10 text-alert',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-2xl border px-5 py-4 text-sm leading-6 ${styles}`}>
      {children}
    </div>
  )
}
