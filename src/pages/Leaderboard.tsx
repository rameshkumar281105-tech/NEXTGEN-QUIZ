import { useEffect, useMemo, useState } from 'react'
import { Trophy, Medal, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { CATEGORIES } from '../types'
import { useAuth } from '../context/AuthContext'

type Range = 'global' | 'weekly' | 'monthly' | 'category'

interface Row {
  user_id: string
  name: string
  avatar: string | null
  xp: number
  level: number
  totalScore: number
  quizzesCompleted: number
}

export default function Leaderboard() {
  const { profile } = useAuth()
  const [range, setRange] = useState<Range>('global')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      if (range === 'global') {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, avatar, xp, level')
          .order('xp', { ascending: false })
          .limit(50)
        const { data: attempts } = await supabase.from('quiz_attempts').select('user_id, score')
        const counts = new Map<string, { total: number; n: number }>()
        ;(attempts ?? []).forEach((a: any) => {
          const c = counts.get(a.user_id) ?? { total: 0, n: 0 }
          c.total += a.score; c.n += 1
          counts.set(a.user_id, c)
        })
        setRows(
          (data ?? []).map((p: any) => ({
            user_id: p.id, name: p.name, avatar: p.avatar, xp: p.xp, level: p.level,
            totalScore: counts.get(p.id)?.total ?? 0, quizzesCompleted: counts.get(p.id)?.n ?? 0,
          }))
        )
      } else {
        const since = new Date()
        if (range === 'weekly') since.setDate(since.getDate() - 7)
        if (range === 'monthly') since.setMonth(since.getMonth() - 1)

        let query = supabase
          .from('quiz_attempts')
          .select('user_id, score, xp_earned, completed_at, profiles(name, avatar, level), quizzes(category)')

        if (range !== 'category') query = query.gte('completed_at', since.toISOString())

        const { data } = await query
        const agg = new Map<string, Row>()
        ;(data ?? []).forEach((a: any) => {
          if (range === 'category' && a.quizzes?.category !== category) return
          const key = a.user_id
          const existing = agg.get(key) ?? {
            user_id: key, name: a.profiles?.name ?? 'Player', avatar: a.profiles?.avatar ?? null,
            xp: 0, level: a.profiles?.level ?? 1, totalScore: 0, quizzesCompleted: 0,
          }
          existing.totalScore += a.score
          existing.xp += a.xp_earned
          existing.quizzesCompleted += 1
          agg.set(key, existing)
        })
        setRows(Array.from(agg.values()).sort((a, b) => b.totalScore - a.totalScore).slice(0, 50))
      }
      setLoading(false)
    }
    load()
  }, [range, category])

  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-text-primary mb-1 flex items-center gap-2"><Trophy className="text-accent-amber" /> Leaderboard</h1>
      <p className="text-text-muted mb-6">See who's leading the pack.</p>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {(['global', 'weekly', 'monthly', 'category'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${range === r ? 'bg-accent-violet text-white' : 'glass-card text-text-muted'}`}
          >
            {r}
          </button>
        ))}
        {range === 'category' && (
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="ml-2 rounded-lg bg-bg-elevated border border-bg-border px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingSpinner full />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Trophy size={26} />} title="No results yet" message="Be the first to play a quiz in this range." />
      ) : (
        <>
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8 items-end">
              {[podium[1], podium[0], podium[2]].map((p, i) =>
                p ? (
                  <div key={p.user_id} className={`glass-card rounded-2xl p-4 text-center ${i === 1 ? 'py-7 border-accent-amber/40' : ''}`}>
                    <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-gradient-to-br from-accent-amber to-accent-violet grid place-items-center font-bold text-bg">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    {i === 1 && <Crown size={16} className="mx-auto text-accent-amber mb-1" />}
                    <p className="text-sm font-semibold text-text-primary truncate">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.xp} XP</p>
                  </div>
                ) : <div key={i} />
              )}
            </div>
          )}

          <div className="glass-card rounded-2xl overflow-hidden">
            {rows.map((r, i) => (
              <div
                key={r.user_id}
                className={`flex items-center gap-4 px-5 py-3.5 text-sm border-b border-bg-border last:border-0 ${r.user_id === profile?.id ? 'bg-accent-violet/10' : ''}`}
              >
                <span className="w-6 text-center font-display text-text-faint">{i + 1 <= 3 ? <Medal size={16} className={i === 0 ? 'text-accent-amber' : i === 1 ? 'text-text-muted' : 'text-[#B08D57]'} /> : i + 1}</span>
                <span className="h-8 w-8 rounded-full bg-bg-elevated grid place-items-center text-xs font-bold text-text-muted">{r.name[0]?.toUpperCase()}</span>
                <span className="flex-1 font-medium text-text-primary truncate">{r.name}</span>
                <span className="text-text-muted hidden sm:block">Lvl {r.level}</span>
                <span className="text-text-muted hidden sm:block">{r.quizzesCompleted} played</span>
                <span className="font-display text-accent-amber w-16 text-right">{r.xp} XP</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
