import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const { show } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await requestPasswordReset(email)
    setLoading(false)
    if (error) {
      setError(error)
      show('Could not send reset email.', 'error')
      return
    }
    setSent(true)
    show('Reset link sent — check your inbox.', 'success')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="font-display text-2xl text-center mb-1 text-text-primary">Reset your password</h1>
        <p className="text-sm text-text-muted text-center mb-7">We'll email you a secure link to set a new password.</p>

        {error && <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm px-3 py-2.5">{error}</div>}

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="text-success" size={36} />
            <p className="text-sm text-text-muted">Check <span className="text-text-primary">{email}</span> for a reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1.5 block">Email</label>
              <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">
                <Mail size={16} className="text-text-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-60"
            >
              <Send size={16} /> {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-sm text-text-muted text-center mt-6">
          Remembered it? <Link to="/login" className="text-accent-cyan hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
