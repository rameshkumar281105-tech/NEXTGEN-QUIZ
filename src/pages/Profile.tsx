import { useState } from 'react'
import { User, Mail, Phone, MapPin, Save, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const { show } = useToast()
  const [name, setName] = useState(profile?.name ?? '')
  const [mobile, setMobile] = useState(profile?.mobile ?? '')
  const [address, setAddress] = useState(profile?.address ?? '')
  const [saving, setSaving] = useState(false)

  if (!profile) return <LoadingSpinner full />

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ name, mobile, address }).eq('id', profile.id)
    setSaving(false)
    if (error) { show('Could not update profile.', 'error'); return }
    await refreshProfile()
    show('Profile updated.', 'success')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-text-primary mb-1">My profile</h1>
      <p className="text-text-muted mb-8">Manage your personal information.</p>

      <div className="glass-card rounded-2xl p-6 mb-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-amber to-accent-violet grid place-items-center font-display font-bold text-bg text-xl">
          {profile.name[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-text-primary">{profile.name}</p>
          <p className="text-sm text-text-muted flex items-center gap-1.5"><ShieldCheck size={13} className="text-accent-cyan" /> {profile.role}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-lg text-accent-amber">{profile.xp} XP</p>
          <p className="text-xs text-text-muted">Level {profile.level} · {profile.streak} day streak</p>
        </div>
      </div>

      <form onSubmit={save} className="glass-card rounded-2xl p-6 space-y-4">
        <Field icon={User} label="Full name" value={name} onChange={setName} />
        <Field icon={Mail} label="Email" value={profile.email} onChange={() => {}} disabled />
        <Field icon={Phone} label="Mobile" value={mobile} onChange={setMobile} />
        <Field icon={MapPin} label="Address" value={address} onChange={setAddress} />
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim disabled:opacity-50">
          <Save size={15} /> {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

function Field({ icon: Icon, label, value, onChange, disabled = false }: {
  icon: React.ElementType; label: string; value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-medium text-text-muted mb-1.5 block">{label}</label>
      <div className={`flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3 ${disabled ? 'opacity-60' : 'focus-within:border-accent-violet/60'}`}>
        <Icon size={16} className="text-text-faint" />
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent py-3 w-full text-sm outline-none placeholder:text-text-faint disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
