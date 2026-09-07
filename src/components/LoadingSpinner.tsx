export default function LoadingSpinner({ full = false, label = 'Loading...' }: { full?: boolean; label?: string }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-bg-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-violet border-r-accent-cyan animate-spin" />
      </div>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  )

  if (full) {
    return <div className="min-h-[60vh] w-full flex items-center justify-center">{spinner}</div>
  }
  return spinner
}
