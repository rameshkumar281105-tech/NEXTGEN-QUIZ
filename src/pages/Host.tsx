import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Play, ListChecks } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import type { Quiz } from '../types'

export default function Host() {
  const { profile } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('quizzes')
        .select('*, questions(count)')
        .eq('creator_id', profile.id)
        .eq('published', true)
        .order('created_at', { ascending: false })
      setQuizzes((data ?? []).map((q: any) => ({ ...q, question_count: q.questions?.[0]?.count ?? 0 })))
      setLoading(false)
    }
    load()
  }, [profile])

  const startGame = async (quizId: string) => {
    setStarting(quizId)
    const { data, error } = await supabase.rpc('create_multiplayer_game', { p_quiz_id: quizId })
    setStarting(null)
    if (error || !data) { show(error?.message ?? 'Could not start a game.', 'error'); return }
    navigate(`/game/${data}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-text-primary mb-1 flex items-center gap-2"><Radio className="text-accent-violet" /> Host a live game</h1>
      <p className="text-text-muted mb-8">Pick one of your published quizzes to generate a game PIN.</p>

      {loading ? (
        <LoadingSpinner full />
      ) : quizzes.length === 0 ? (
        <EmptyState icon={<ListChecks size={26} />} title="No published quizzes" message="Publish a quiz first before hosting a live game." />
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div key={q.id} className="glass-card rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary">{q.title}</p>
                <p className="text-xs text-text-muted">{q.category} · {q.difficulty} · {q.question_count} questions</p>
              </div>
              <button
                onClick={() => startGame(q.id)}
                disabled={starting === q.id}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim disabled:opacity-50"
              >
                <Play size={14} /> {starting === q.id ? 'Starting...' : 'Start game'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
