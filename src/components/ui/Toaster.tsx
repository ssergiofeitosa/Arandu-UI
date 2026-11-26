import { CheckCircle2, Info, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'

export function Toaster() {
  const { toasts, dismissToast } = useApp()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5 text-foreground shadow-lg"
        >
          <span className="mt-0.5 shrink-0">
            {toast.variant === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-light-green-700" />
            ) : (
              <Info className="h-4 w-4 text-brilliant-azure-600" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-foreground">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Fechar notificação"
            className="rounded-sm p-1 text-muted hover:bg-default hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
