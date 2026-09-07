import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import GorillaGuard from '../components/GorillaGuard'

export default function Signup() {
  const { signUp } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    confirm: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value

      // Mobile number: numbers only, maximum 10 digits
      if (key === 'mobile') {
        value = value.replace(/\D/g, '').slice(0, 10)
      }

      setForm((prev) => ({
        ...prev,
        [key]: value,
      }))
    }

  // Password validation
  const passwordRules = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(
      form.password
    ),
  }

  const passwordIsValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Username
    if (!form.username.trim()) {
      setError('Username is required.')
      return
    }

    // Email
    if (!form.email.trim()) {
      setError('Email is required.')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    // Mobile
    if (!form.mobile) {
      setError('Mobile number is required.')
      return
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Mobile number must contain exactly 10 digits.')
      return
    }

    // Password
    if (!form.password) {
      setError('Password is required.')
      return
    }

    if (!passwordRules.length) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!passwordRules.uppercase) {
      setError('Password must contain at least one uppercase letter.')
      return
    }

    if (!passwordRules.lowercase) {
      setError('Password must contain at least one lowercase letter.')
      return
    }

    if (!passwordRules.number) {
      setError('Password must contain at least one number.')
      return
    }

    if (!passwordRules.special) {
      setError('Password must contain at least one special character.')
      return
    }

    // Confirm password
    if (!form.confirm) {
      setError('Please confirm your password.')
      return
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await signUp(form.email, form.password, {
      name: form.username,
      mobile: `+91${form.mobile}`,
      address: form.address,
    })

    setLoading(false)

    if (error) {
      setError(error)
      show('Sign up failed.', 'error')
      return
    }

    show(
      'Account created! Check your email if confirmation is required.',
      'success'
    )

    navigate('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-3xl p-8">

        <GorillaGuard
          value={form.password}
          visible={showPassword}
          focused={focused}
        />

        <h1 className="font-display text-2xl text-center mt-4 mb-1 text-text-primary">
          Create your account
        </h1>

        <p className="text-sm text-text-muted text-center mb-7">
          Join students and professors already playing.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm px-3 py-2.5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <Field
            icon={User}
            label="Username *"
            value={form.username}
            onChange={set('username')}
            placeholder="Enter username"
            required
            autoComplete="username"
          />

          {/* Email */}
          <Field
            icon={Mail}
            label="Email *"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          {/* Mobile Number */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Mobile number *
            </label>

            <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 focus-within:border-accent-violet/60">

              <Phone size={16} className="text-text-faint" />

              {/* Country Code */}
              <span className="text-sm text-text-primary font-medium border-r border-bg-border pr-2">
                +91
              </span>

              {/* Mobile */}
              <input
                type="tel"
                value={form.mobile}
                onChange={set('mobile')}
                placeholder="9876543210"
                required
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel-national"
                className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
              />

            </div>

            <p className="text-xs text-text-faint mt-1">
              Enter exactly 10 digits
            </p>
          </div>

          {/* Address */}
          <Field
            icon={MapPin}
            label="Address"
            value={form.address}
            onChange={set('address')}
            placeholder="City, Country"
            autoComplete="address-line1"
          />

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Password *
            </label>

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
                placeholder="Enter strong password"
                className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint"
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-text-faint hover:text-text-primary"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>

            </div>

            {/* Password Rules */}
            <div className="mt-3 text-xs space-y-1.5">

              <p className="text-text-muted font-medium mb-2">
                Password must contain:
              </p>

              <PasswordRule
                valid={passwordRules.length}
                text="At least 8 characters"
              />

              <PasswordRule
                valid={passwordRules.uppercase}
                text="One uppercase letter (A-Z)"
              />

              <PasswordRule
                valid={passwordRules.lowercase}
                text="One lowercase letter (a-z)"
              />

              <PasswordRule
                valid={passwordRules.number}
                text="One number (0-9)"
              />

              <PasswordRule
                valid={passwordRules.special}
                text="One special character (!@#$%...)"
              />

            </div>
          </div>

          {/* Confirm Password */}
          <Field
            icon={Lock}
            label="Confirm password *"
            type={showPassword ? 'text' : 'password'}
            value={form.confirm}
            onChange={set('confirm')}
            placeholder="Repeat password"
            required
            autoComplete="new-password"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !passwordIsValid}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <UserPlus size={16} />

            {loading
              ? 'Creating account...'
              : 'Create account'}
          </button>

        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-accent-cyan hover:underline"
          >
            Log in
          </Link>
        </p>

      </div>
    </div>
  )
}

/* --------------------------------
   Reusable Input Field
--------------------------------- */

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  autoComplete,
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
      <label className="text-xs font-medium text-text-muted mb-1.5 block">
        {label}
      </label>

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

/* --------------------------------
   Password Rule Component
--------------------------------- */

function PasswordRule({
  valid,
  text,
}: {
  valid: boolean
  text: string
}) {
  return (
    <div
      className={`flex items-center gap-2 transition-colors duration-200 ${
        valid ? 'text-green-500' : 'text-text-faint'
      }`}
    >
      <span
        className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold transition-all duration-200 ${
          valid
            ? 'bg-green-500 text-white'
            : 'border border-text-faint'
        }`}
      >
        {valid ? '✓' : ''}
      </span>

      <span>{text}</span>
    </div>
  )
}