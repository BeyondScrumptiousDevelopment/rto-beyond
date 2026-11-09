import { btnPrimary } from '../brand/ui'

export function Loading({ label = 'Loading the cake catalogue…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 pt-32" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-6 text-slate">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-navy/20 border-t-navy motion-reduce:animate-none" aria-hidden />
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
        <p className="mb-4 leading-8 text-navy/75">{message}</p>
        <p className="mb-10 text-sm text-navy/60">
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
    info: 'border-navy/20 bg-navy/5 text-navy/80',
    warning: 'border-slate/40 bg-sky text-navy',
    error: 'border-alert/40 bg-alert-soft text-alert',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-none border px-5 py-4 text-sm leading-6 ${styles}`}>
      {children}
    </div>
  )
}
