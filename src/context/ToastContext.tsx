import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))

  const icon = (kind: ToastKind) =>
    kind === 'success' ? <CheckCircle2 size={18} className="text-success shrink-0" /> :
    kind === 'error' ? <XCircle size={18} className="text-danger shrink-0" /> :
    <Info size={18} className="text-accent-cyan shrink-0" />

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="glass-card animate-popIn flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg shadow-black/40"
          >
            {icon(t.kind)}
            <p className="text-sm text-text-primary flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-text-faint hover:text-text-primary">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
