import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Flame, Star, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

interface AttemptRow {
  id: string
  score: number
  percentage: number
  correct_answers: number
  completed_at: string
  quizzes: { title: string; category: string; difficulty: string } | null
}

export default function Performance() {
  const { profile } = useAuth()
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('quiz_attempts')
        .select('id, score, percentage, correct_answers, completed_at, quizzes(title, category, difficulty)')
        .eq('user_id', profile.id)
        .order('completed_at', { ascending: false })
      setAttempts((data as any) ?? [])
      setLoading(false)
    }
    load()
  }, [profile])

  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; n: number }>()
    attempts.forEach((a) => {
      const cat = a.quizzes?.category ?? 'Unknown'
      const c = map.get(cat) ?? { total: 0, n: 0 }
      c.total += a.percentage; c.n += 1
      map.set(cat, c)
    })
    return Array.from(map.entries()).map(([cat, v]) => ({ cat, avg: Math.round(v.total / v.n) }))
  }, [attempts])

  const byDifficulty = useMemo(() => {
    const map = new Map<string, { total: number; n: number }>()
    attempts.forEach((a) => {
      const d = a.quizzes?.difficulty ?? 'unknown'
      const c = map.get(d) ?? { total: 0, n: 0 }
      c.total += a.percentage; c.n += 1
      map.set(d, c)
    })
    return Array.from(map.entries()).map(([d, v]) => ({ d, avg: Math.round(v.total / v.n) }))
  }, [attempts])

  if (!profile) return <LoadingSpinner full />

  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0
  const best = attempts.length ? Math.max(...attempts.map((a) => a.percentage)) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-text-primary mb-1">My performance</h1>
      <p className="text-text-muted mb-8">A full breakdown of how you're doing.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <Stat icon={BarChart3} label="Attempts" value={attempts.length} />
        <Stat icon={Target} label="Average score" value={`${avg}%`} />
        <Stat icon={Star} label="Best score" value={`${best}%`} />
        <Stat icon={Flame} label="Streak" value={profile.streak} />
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : attempts.length === 0 ? (
        <EmptyState icon={<BarChart3 size={26} />} title="No history yet" message="Your quiz attempts will show up here." action={<Link to="/quizzes" className="mt-2 px-4 py-2 rounded-lg bg-accent-violet text-white text-sm font-semibold">Browse quizzes</Link>} />
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-text-primary mb-4">By category</h3>
              <div className="space-y-3">
                {byCategory.map((c) => (
                  <div key={c.cat}>
                    <div className="flex justify-between text-xs text-text-muted mb-1"><span>{c.cat}</span><span>{c.avg}%</span></div>
                    <div className="h-1.5 rounded-full bg-bg-border overflow-hidden"><div className="h-full bg-accent-violet" style={{ width: `${c.avg}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-text-primary mb-4">By difficulty</h3>
              <div className="space-y-3">
                {byDifficulty.map((c) => (
                  <div key={c.d}>
                    <div className="flex justify-between text-xs text-text-muted mb-1 capitalize"><span>{c.d}</span><span>{c.avg}%</span></div>
                    <div className="h-1.5 rounded-full bg-bg-border overflow-hidden"><div className="h-full bg-accent-cyan" style={{ width: `${c.avg}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-text-primary mb-4">Quiz history</h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            {attempts.map((a) => (
              <Link key={a.id} to={`/results/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 text-sm border-b border-bg-border last:border-0 hover:bg-bg-elevated/50">
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{a.quizzes?.title ?? 'Deleted quiz'}</p>
                  <p className="text-xs text-text-muted">{a.quizzes?.category} · {new Date(a.completed_at).toLocaleDateString()}</p>
                </div>
                <span className="font-display text-text-primary">{a.percentage}%</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <Icon size={16} className="text-accent-violet" />
      <p className="font-display text-xl text-text-primary mt-2">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}
