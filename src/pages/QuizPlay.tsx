import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Timer, ChevronLeft, ChevronRight, Scissors, SkipForward, Clock3, Lightbulb, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Question, Quiz } from '../types'
import { LIFELINE_LIMITS } from '../types'

type OptionKey = 'a' | 'b' | 'c' | 'd'
const ALL_OPTIONS: OptionKey[] = ['a', 'b', 'c', 'd']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizPlay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { show } = useToast()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [optionOrder, setOptionOrder] = useState<Record<string, OptionKey[]>>({})
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, OptionKey | null>>({})
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [removedOptions, setRemovedOptions] = useState<OptionKey[]>([])
  const [lifelinesUsed, setLifelinesUsed] = useState({ fiftyFifty: 0, skip: 0, extraTime: 0, hint: 0 })
  const [showHint, setShowHint] = useState(false)

  const quizStartRef = useRef<number>(0)
  const questionStartRef = useRef<number>(0)
  const questionDeadlineRef = useRef<number>(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', id).maybeSingle()
      const { data: qData } = await supabase.from('questions').select('*').eq('quiz_id', id).order('question_order', { ascending: true })

      const bank = (qData ?? []) as Question[]
      const perAttempt = (quizData as Quiz | null)?.questions_per_attempt
      const shuffledBank = shuffle(bank)
      const selected = perAttempt && perAttempt > 0 && perAttempt < shuffledBank.length
        ? shuffledBank.slice(0, perAttempt)
        : shuffledBank

      const orderMap: Record<string, OptionKey[]> = {}
      // Keep answer labels stable (A/B/C/D). The quiz should not change the
      // option text or label between attempts.
      selected.forEach((q) => { orderMap[q.id] = ALL_OPTIONS })

      setQuiz(quizData as Quiz)
      setQuestions(selected)
      setOptionOrder(orderMap)
      setLoading(false)
    }
    load()
  }, [id])

  const question = questions[current]

  useEffect(() => {
    if (!started || !quiz) return
    const now = Date.now()
    questionStartRef.current = now
    questionDeadlineRef.current = now + quiz.time_limit * 1000
    setTimeLeft(quiz.time_limit)
    setRemovedOptions([])
    setShowHint(false)
  }, [current, started, quiz])

  useEffect(() => {
    if (!started || !question || !quiz) return

    // Drive the countdown from an absolute deadline. This prevents the first
    // question from being auto-skipped because the previous render had 0s.
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((questionDeadlineRef.current - Date.now()) / 1000))
      setTimeLeft(remaining)

      if (remaining <= 0) {
        window.clearInterval(interval)
        goNext(true)
      }
    }, 250)

    return () => window.clearInterval(interval)
  }, [current, started, question, quiz])

  const selectAnswer = (opt: OptionKey) => {
    if (!question) return
    if (answers[question.id] !== undefined) return // already locked in
    const elapsed = (Date.now() - questionStartRef.current) / 1000
    setAnswers((a) => ({ ...a, [question.id]: opt }))
    setResponseTimes((r) => ({ ...r, [question.id]: Math.round(elapsed * 10) / 10 }))
  }

  const goNext = (auto = false) => {
    if (!question) return
    // lock in "no answer" if time ran out
    if (auto && answers[question.id] === undefined) {
      setAnswers((a) => ({ ...a, [question.id]: null }))
      setResponseTimes((r) => ({ ...r, [question.id]: quiz?.time_limit ?? 0 }))
    }
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      finish()
    }
  }

  const goPrev = () => {
    if (current > 0) setCurrent((c) => c - 1)
  }

  const useFiftyFifty = () => {
    if (!question || lifelinesUsed.fiftyFifty >= LIFELINE_LIMITS.fiftyFifty || removedOptions.length) return
    const wrongOptions = (['a', 'b', 'c', 'd'] as OptionKey[]).filter((o) => o !== question.correct_answer)
    const toRemove = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2)
    setRemovedOptions(toRemove)
    setLifelinesUsed((l) => ({ ...l, fiftyFifty: l.fiftyFifty + 1 }))
  }

  const useSkip = () => {
    if (lifelinesUsed.skip >= LIFELINE_LIMITS.skip) return
    setLifelinesUsed((l) => ({ ...l, skip: l.skip + 1 }))
    goNext(true)
  }

  const useExtraTime = () => {
    if (lifelinesUsed.extraTime >= LIFELINE_LIMITS.extraTime) return
    setLifelinesUsed((l) => ({ ...l, extraTime: l.extraTime + 1 }))
    setTimeLeft((t) => t + 15)
  }

  const useHint = () => {
    if (lifelinesUsed.hint >= LIFELINE_LIMITS.hint) return
    setLifelinesUsed((l) => ({ ...l, hint: l.hint + 1 }))
    setShowHint(true)
  }

  const finish = async () => {
    if (!quiz || !profile) return
    setSubmitting(true)

    let correct = 0, wrong = 0, unanswered = 0, score = 0
    const rows = questions.map((q) => {
      const selected = answers[q.id] ?? null
      const isCorrect = selected === q.correct_answer
      if (selected === null) unanswered++
      else if (isCorrect) { correct++; score += q.points } else wrong++
      return {
        question_id: q.id,
        selected_answer: selected,
        is_correct: isCorrect,
        points: isCorrect ? q.points : 0,
        response_time: responseTimes[q.id] ?? 0,
      }
    })

    const totalPossible = questions.reduce((s, q) => s + q.points, 0) || 1
    const percentage = Math.round((score / totalPossible) * 100)
    const timeTaken = Math.round((Date.now() - quizStartRef.current) / 1000)
    const xpEarned = correct * 10 + (percentage === 100 ? 50 : 0)

    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: profile.id,
        quiz_id: quiz.id,
        score,
        percentage,
        correct_answers: correct,
        wrong_answers: wrong,
        unanswered,
        time_taken: timeTaken,
        xp_earned: xpEarned,
      })
      .select()
      .single()

    if (error || !attempt) {
      show('Could not save your attempt. Please try again.', 'error')
      setSubmitting(false)
      return
    }

    await supabase.from('answers').insert(rows.map((r) => ({ ...r, attempt_id: attempt.id })))

    const respTimes = Object.values(responseTimes)
    const avgResponseTime = respTimes.length ? respTimes.reduce((s, t) => s + t, 0) / respTimes.length : null

    // Update XP / level / streak via RPC (handles achievements server-side)
    await supabase.rpc('record_quiz_completion', {
      p_user_id: profile.id,
      p_xp_earned: xpEarned,
      p_percentage: percentage,
      p_category: quiz.category,
      p_avg_response_time: avgResponseTime,
    })

    show('Quiz submitted! Here are your results.', 'success')
    navigate(`/results/${attempt.id}`)
  }

  const progress = questions.length ? Math.round(((current + (started ? 1 : 0)) / questions.length) * 100) : 0

  if (loading) return <LoadingSpinner full />
  if (!quiz) return <div className="max-w-lg mx-auto px-4 py-24 text-center text-text-muted">Quiz not found. <Link to="/quizzes" className="text-accent-cyan hover:underline">Back to quizzes</Link></div>
  if (!questions.length) return <div className="max-w-lg mx-auto px-4 py-24 text-center text-text-muted">This quiz has no questions yet.</div>

  if (!started) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="glass-card rounded-3xl p-10">
          <span className="text-xs font-medium text-accent-cyan bg-accent-cyan/10 px-3 py-1 rounded-full">{quiz.category} · {quiz.difficulty}</span>
          <h1 className="font-display text-3xl text-text-primary mt-4 mb-2">{quiz.title}</h1>
          <p className="text-text-muted mb-6">{quiz.description}</p>
          <div className="flex justify-center gap-6 text-sm text-text-muted mb-8">
            <span>{questions.length} questions</span>
            <span>{quiz.time_limit}s per question</span>
          </div>
          <button
            onClick={() => { setStarted(true); quizStartRef.current = Date.now() }}
            className="px-6 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim"
          >
            Start quiz
          </button>
        </div>
      </div>
    )
  }

  const selected = answers[question.id]
  const locked = selected !== undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-3 text-sm text-text-muted">
        <span>Question {current + 1}/{questions.length}</span>
        <span className={`flex items-center gap-1.5 font-semibold ${timeLeft <= 5 ? 'text-danger' : 'text-text-primary'}`}>
          <Timer size={15} /> {timeLeft}s
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-border overflow-hidden mb-8">
        <div className="h-full bg-gradient-to-r from-accent-violet to-accent-cyan transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="glass-card rounded-3xl p-7">
        <p className="font-display text-xl text-text-primary mb-6">{question.question_text}</p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {(optionOrder[question.id] ?? ALL_OPTIONS).map((opt) => {
            const text = question[`option_${opt}` as const]
            const isRemoved = removedOptions.includes(opt)
            const isSelected = selected === opt
            const isCorrect = locked && opt === question.correct_answer
            const isWrongPick = locked && isSelected && opt !== question.correct_answer

            return (
              <button
                key={opt}
                disabled={locked || isRemoved}
                onClick={() => selectAnswer(opt)}
                className={`text-left rounded-xl px-4 py-3.5 text-sm font-medium border transition-colors
                  ${isRemoved ? 'opacity-25 border-bg-border bg-bg-elevated cursor-not-allowed' : ''}
                  ${!locked && !isRemoved ? 'border-bg-border bg-bg-elevated hover:border-accent-violet/60 text-text-primary' : ''}
                  ${locked && isCorrect ? 'border-success/50 bg-success/10 text-success' : ''}
                  ${isWrongPick ? 'border-danger/50 bg-danger/10 text-danger' : ''}
                  ${locked && !isCorrect && !isWrongPick ? 'border-bg-border bg-bg-elevated text-text-muted' : ''}
                `}
              >
                <span className="uppercase text-xs text-text-faint mr-2">{opt}</span>{text}
              </button>
            )
          })}
        </div>

        {showHint && question.explanation && (
          <div className="mb-6 rounded-lg border border-accent-amber/30 bg-accent-amber/10 text-accent-amber text-sm px-3 py-2.5 flex items-center gap-2">
            <Lightbulb size={15} /> {question.explanation}
          </div>
        )}

        {/* Lifelines */}
        <div className="flex flex-wrap gap-2 mb-6">
          <LifelineButton icon={Scissors} label="50/50" used={lifelinesUsed.fiftyFifty >= LIFELINE_LIMITS.fiftyFifty} onClick={useFiftyFifty} />
          <LifelineButton icon={SkipForward} label="Skip" used={lifelinesUsed.skip >= LIFELINE_LIMITS.skip} onClick={useSkip} />
          <LifelineButton icon={Clock3} label="+15s" used={lifelinesUsed.extraTime >= LIFELINE_LIMITS.extraTime} onClick={useExtraTime} />
          <LifelineButton icon={Lightbulb} label="Hint" used={lifelinesUsed.hint >= LIFELINE_LIMITS.hint || !question.explanation} onClick={useHint} />
        </div>

        <div className="flex items-center justify-between">
          <button onClick={goPrev} disabled={current === 0} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg glass-card text-sm font-medium disabled:opacity-30">
            <ChevronLeft size={15} /> Previous
          </button>
          {current === questions.length - 1 ? (
            <button
              onClick={() => finish()}
              disabled={!locked || submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim disabled:opacity-40"
            >
              <Flag size={15} /> {submitting ? 'Submitting...' : 'Submit quiz'}
            </button>
          ) : (
            <button
              onClick={() => goNext()}
              disabled={!locked}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim disabled:opacity-40"
            >
              Next <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function LifelineButton({ icon: Icon, label, used, onClick }: { icon: React.ElementType; label: string; used: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={used}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-bg-border bg-bg-elevated text-text-muted hover:border-accent-violet/50 hover:text-text-primary disabled:opacity-30 disabled:hover:border-bg-border"
    >
      <Icon size={13} /> {label}
    </button>
  )
}
