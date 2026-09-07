import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GorillaGuard from '../components/GorillaGuard'

export default function Signup() {
  const { signUp } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', mobile: '', address: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')

    setLoading(true)
    const { error } = await signUp(form.email, form.password, { name: form.name, mobile: form.mobile, address: form.address })
    setLoading(false)

    if (error) {
      setError(error)
      show('Sign up failed.', 'error')
      return
    }
    show('Account created! Check your email if confirmation is required.', 'success')
    navigate('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-3xl p-8">
        <GorillaGuard value={form.password} visible={showPassword} focused={focused} />

        <h1 className="font-display text-2xl text-center mt-4 mb-1 text-text-primary">Create your account</h1>
        <p className="text-sm text-text-muted text-center mb-7">Join students and professors already playing.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm px-3 py-2.5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field icon={User} label="Full name" value={form.name} onChange={set('name')} placeholder="Jordan Lee" required autoComplete="name" />
          <Field icon={Mail} label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
          <Field icon={Phone} label="Mobile" value={form.mobile} onChange={set('mobile')} placeholder="+1 555 010 1234" autoComplete="tel" />
          <Field icon={MapPin} label="Address" value={form.address} onChange={set('address')} placeholder="City, Country" autoComplete="address-line1" />

          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Password</label>
            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">
              <Lock size={16} className="text-text-faint" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-text-faint hover:text-text-primary" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Field icon={Lock} label="Confirm password" type={showPassword ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" required autoComplete="new-password" />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-60"
          >
            <UserPlus size={16} /> {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Already have an account? <Link to="/login" className="text-accent-cyan hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  icon: Icon, label, value, onChange, placeholder, type = 'text', required = false, autoComplete,
}: {
  icon: React.ElementType
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-text-muted mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">
        <Icon size={16} className="text-text-faint" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
        />
      </div>
    </div>
  )
}
