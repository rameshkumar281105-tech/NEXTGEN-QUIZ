import { useEffect, useState } from 'react'
import { Award, Lock, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

interface AchievementRow { id: string; name: string; description: string; icon: string; unlocked: boolean }
interface RewardRow { id: string; name: string; description: string; xp_required: number; earned: boolean }

export default function Rewards() {
  const { profile } = useAuth()
  const [achievements, setAchievements] = useState<AchievementRow[]>([])
  const [rewards, setRewards] = useState<RewardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      setLoading(true)
      const [{ data: all }, { data: mine }, { data: allRewards }, { data: myRewards }] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', profile.id),
        supabase.from('rewards').select('*').order('xp_required'),
        supabase.from('user_rewards').select('reward_id').eq('user_id', profile.id),
      ])
      const mineSet = new Set((mine ?? []).map((m: any) => m.achievement_id))
      setAchievements((all ?? []).map((a: any) => ({ ...a, unlocked: mineSet.has(a.id) })))
      const rewardSet = new Set((myRewards ?? []).map((m: any) => m.reward_id))
      setRewards((allRewards ?? []).map((r: any) => ({ ...r, earned: rewardSet.has(r.id) })))
      setLoading(false)
    }
    load()
  }, [profile])

  if (!profile) return <LoadingSpinner full />

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-text-primary mb-1 flex items-center gap-2"><Award className="text-accent-amber" /> Rewards & achievements</h1>
      <p className="text-text-muted mb-8">You have <span className="text-accent-amber font-semibold">{profile.xp} XP</span>. Keep playing to unlock more.</p>

      {loading ? <LoadingSpinner full /> : (
        <>
          <h2 className="font-display text-lg text-text-primary mb-4">Achievements</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {achievements.map((a) => (
              <div key={a.id} className={`glass-card rounded-2xl p-5 flex items-start gap-3 ${!a.unlocked ? 'opacity-50' : ''}`}>
                <span className={`h-10 w-10 rounded-xl grid place-items-center text-lg shrink-0 ${a.unlocked ? 'bg-accent-amber/15 text-accent-amber' : 'bg-bg-elevated text-text-faint'}`}>
                  {a.unlocked ? a.icon : <Lock size={16} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{a.name}</p>
                  <p className="text-xs text-text-muted">{a.description}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-lg text-text-primary mb-4">Reward tiers</h2>
          <div className="space-y-3">
            {rewards.map((r) => {
              const progress = Math.min(100, Math.round((profile.xp / r.xp_required) * 100))
              return (
                <div key={r.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <span className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${r.earned ? 'bg-success/15 text-success' : 'bg-bg-elevated text-text-faint'}`}>
                    <Gift size={16} />
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-text-primary">{r.name}</span>
                      <span className="text-text-muted">{r.xp_required} XP</span>
                    </div>
                    <p className="text-xs text-text-muted mb-2">{r.description}</p>
                    <div className="h-1.5 rounded-full bg-bg-border overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent-amber to-accent-violet" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
