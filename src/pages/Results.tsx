import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Trophy, CheckCircle2, XCircle, MinusCircle, RotateCcw, LayoutDashboard, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Answer, Question, QuizAttempt } from '../types'

interface ReviewRow extends Answer {
  question: Question
}

export default function Results() {
  const { id } = useParams()
  const [attempt, setAttempt] = useState<(QuizAttempt & { quiz_id: string }) | null>(null)
  const [review, setReview] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: a } = await supabase.from('quiz_attempts').select('*, quizzes(title)').eq('id', id).maybeSingle()
      if (!a) { setLoading(false); return }
      setAttempt({ ...a, quiz_title: (a as any).quizzes?.title } as any)

      const { data: answers } = await supabase.from('answers').select('*').eq('attempt_id', id)
      const questionIds = (answers ?? []).map((x: Answer) => x.question_id)
      const { data: questions } = await supabase.from('questions').select('*').in('id', questionIds)
      const qMap = new Map((questions ?? []).map((q: Question) => [q.id, q]))
      setReview(
        (answers ?? [])
          .map((a: Answer) => ({ ...a, question: qMap.get(a.question_id) as Question }))
          .filter((r) => r.question)
          .sort((x, y) => x.question.question_order - y.question.question_order)
      )
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <LoadingSpinner full />
  if (!attempt) return <div className="max-w-lg mx-auto px-4 py-24 text-center text-text-muted">Result not found.</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="glass-card rounded-3xl p-8 text-center mb-8">
        <Trophy className="mx-auto text-accent-amber mb-3" size={40} />
        <h1 className="font-display text-3xl text-text-primary mb-1">{attempt.percentage}%</h1>
        <p className="text-text-muted mb-6">{(attempt as any).quiz_title}</p>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-sm">
          <StatBox label="Score" value={attempt.score} />
          <StatBox label="Correct" value={attempt.correct_answers} color="text-success" />
          <StatBox label="Wrong" value={attempt.wrong_answers} color="text-danger" />
          <StatBox label="Skipped" value={attempt.unanswered} color="text-text-muted" />
          <StatBox label="Time" value={`${attempt.time_taken}s`} />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-amber/10 text-accent-amber text-sm font-medium">
          <Award size={15} /> +{attempt.xp_earned} XP earned
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link to={`/quiz/${attempt.quiz_id}`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg glass-card text-sm font-semibold hover:border-accent-violet/50">
            <RotateCcw size={14} /> Retry quiz
          </Link>
          <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg glass-card text-sm font-semibold hover:border-accent-violet/50">
            <LayoutDashboard size={14} /> Dashboard
          </Link>
          <Link to="/leaderboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim">
            <Trophy size={14} /> Leaderboard
          </Link>
        </div>
      </div>

      <h2 className="font-display text-lg text-text-primary mb-4">Question-by-question review</h2>
      <div className="space-y-4">
        {review.map((r, i) => (
          <div key={r.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              {r.is_correct ? <CheckCircle2 className="text-success shrink-0 mt-0.5" size={18} /> :
                r.selected_answer ? <XCircle className="text-danger shrink-0 mt-0.5" size={18} /> :
                <MinusCircle className="text-text-faint shrink-0 mt-0.5" size={18} />}
              <p className="text-sm font-medium text-text-primary">{i + 1}. {r.question.question_text}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs mb-2">
              {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                const isCorrect = opt === r.question.correct_answer
                const isPicked = opt === r.selected_answer
                return (
                  <div key={opt} className={`rounded-lg px-3 py-2 border ${isCorrect ? 'border-success/40 bg-success/10 text-success' : isPicked ? 'border-danger/40 bg-danger/10 text-danger' : 'border-bg-border bg-bg-elevated text-text-muted'}`}>
                    <span className="uppercase mr-1.5 text-text-faint">{opt}</span>{r.question[`option_${opt}` as const]}
                  </div>
                )
              })}
            </div>
            {r.question.explanation && <p className="text-xs text-text-muted mt-2">💡 {r.question.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatBox({ label, value, color = 'text-text-primary' }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <p className={`font-display text-lg ${color}`}>{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}
