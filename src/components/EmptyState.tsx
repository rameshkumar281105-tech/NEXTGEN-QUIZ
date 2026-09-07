import { ReactNode } from 'react'

export default function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode
  title: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="glass-card rounded-2xl px-6 py-14 flex flex-col items-center text-center gap-3">
      {icon && <div className="text-accent-violet">{icon}</div>}
      <h3 className="font-display text-lg text-text-primary">{title}</h3>
      {message && <p className="text-sm text-text-muted max-w-sm">{message}</p>}
      {action}
    </div>
  )
}
