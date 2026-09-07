import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Users, Copy, Play, ChevronRight, Trophy, Timer, Crown, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import type { GamePlayer, MultiplayerGame, Question, Quiz } from '../types'

type OptionKey = 'a' | 'b' | 'c' | 'd'

export default function Game() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { show } = useToast()

  const [game, setGame] = useState<MultiplayerGame | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [myPlayer, setMyPlayer] = useState<GamePlayer | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answered, setAnswered] = useState<Record<string, OptionKey>>({})
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null)

  const isHost = game && profile && game.host_id === profile.id
  const question = game ? questions[game.current_question] : undefined

  // initial load
  useEffect(() => {
    if (!id || !profile) return
    const load = async () => {
      setLoading(true)
      const { data: g } = await supabase.from('multiplayer_games').select('*').eq('id', id).maybeSingle()
      if (!g) { setLoading(false); return }
      setGame(g as MultiplayerGame)

      const [{ data: qz }, { data: qs }, { data: pl }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', g.quiz_id).maybeSingle(),
        supabase.from('questions').select('*').eq('quiz_id', g.quiz_id).order('question_order'),
        supabase.from('game_players').select('*').eq('game_id', id).order('joined_at'),
      ])
      setQuiz(qz as Quiz)
      setQuestions((qs ?? []) as Question[])
      setPlayers((pl ?? []) as GamePlayer[])
      setMyPlayer((pl ?? []).find((p: GamePlayer) => p.user_id === profile.id) ?? null)
      setLoading(false)
    }
    load()
  }, [id, profile])

  // realtime subscriptions
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`game-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_games', filter: `id=eq.${id}` }, (payload) => {
        setGame(payload.new as MultiplayerGame)
        setAnswered({})
        setLastResult(null)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_players', filter: `game_id=eq.${id}` }, (payload) => {
        setPlayers((p) => [...p, payload.new as GamePlayer])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_players', filter: `game_id=eq.${id}` }, (payload) => {
        setPlayers((p) => p.map((pl) => (pl.id === (payload.new as GamePlayer).id ? (payload.new as GamePlayer) : pl)))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  // countdown per active question
  const questionStartRef = useRef<number>(0)
  useEffect(() => {
    if (!game || game.status !== 'active' || !quiz) return
    questionStartRef.current = game.question_started_at ? new Date(game.question_started_at).getTime() : Date.now()
    const tick = () => {
      const elapsed = (Date.now() - questionStartRef.current) / 1000
      setTimeLeft(Math.max(0, Math.ceil(quiz.time_limit - elapsed)))
    }
    tick()
    const iv = setInterval(tick, 500)
    return () => clearInterval(iv)
  }, [game, quiz])

  const copyPin = () => {
    if (!game) return
    navigator.clipboard.writeText(game.game_pin)
    show('PIN copied to clipboard.', 'success')
  }

  const copyLink = () => {
    if (!game) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${game.game_pin}`)
    show('Join link copied.', 'success')
  }

  const startGame = async () => {
    if (!game) return
    const { error } = await supabase.rpc('start_multiplayer_game', { p_game_id: game.id })
    if (error) show(error.message, 'error')
  }

  const nextQuestion = async () => {
    if (!game) return
    const { error } = await supabase.rpc('advance_multiplayer_game', { p_game_id: game.id })
    if (error) show(error.message, 'error')
  }

  const submitAnswer = async (opt: OptionKey) => {
    if (!game || !question || answered[question.id]) return
    const responseTime = Math.round(((Date.now() - questionStartRef.current) / 1000) * 10) / 10
    setAnswered((a) => ({ ...a, [question.id]: opt }))
    const { data, error } = await supabase.rpc('submit_multiplayer_answer', {
      p_game_id: game.id,
      p_question_id: question.id,
      p_selected_answer: opt,
      p_response_time: responseTime,
    })
    if (error) { show(error.message, 'error'); return }
    setLastResult({ correct: (data as any).is_correct, points: (data as any).points })
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  if (loading) return <LoadingSpinner full />
  if (!game || !quiz) return <div className="max-w-lg mx-auto px-4 py-24 text-center text-text-muted">Game not found.</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_280px] gap-6">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-text-primary">{quiz.title}</h1>
            <p className="text-text-muted text-sm">{game.status === 'lobby' ? 'Waiting in lobby' : game.status === 'active' ? `Question ${game.current_question + 1}/${questions.length}` : 'Game finished'}</p>
          </div>
          {game.status === 'active' && (
            <span className={`flex items-center gap-1.5 font-display text-lg ${timeLeft <= 5 ? 'text-danger' : 'text-text-primary'}`}>
              <Timer size={18} /> {timeLeft}s
            </span>
          )}
        </div>

        {game.status === 'lobby' && (
          <div className="glass-card rounded-3xl p-8 text-center mb-6">
            <p className="text-xs text-text-muted mb-2">Game PIN</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="font-display text-5xl tracking-[0.2em] text-gradient">{game.game_pin}</span>
              <button onClick={copyPin} className="p-2 rounded-lg glass-card hover:border-accent-violet/50"><Copy size={16} /></button>
            </div>
            <button onClick={copyLink} className="text-xs text-accent-cyan hover:underline mb-6">Copy shareable join link</button>
            {isHost ? (
              <button
                onClick={startGame}
                disabled={players.length === 0}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-40"
              >
                <Play size={16} /> Start game ({players.length} joined)
              </button>
            ) : (
              <p className="text-sm text-text-muted">Waiting for the host to start the game...</p>
            )}
          </div>
        )}

        {game.status === 'active' && question && (
          <div className="glass-card rounded-3xl p-7">
            <div className="h-1.5 rounded-full bg-bg-border overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-accent-violet to-accent-cyan transition-all" style={{ width: `${(timeLeft / quiz.time_limit) * 100}%` }} />
            </div>
            <p className="font-display text-xl text-text-primary mb-6">{question.question_text}</p>

            {!isHost && (
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {(['a', 'b', 'c', 'd'] as OptionKey[]).map((opt) => {
                  const text = question[`option_${opt}` as const]
                  const picked = answered[question.id] === opt
                  return (
                    <button
                      key={opt}
                      disabled={Boolean(answered[question.id])}
                      onClick={() => submitAnswer(opt)}
                      className={`text-left rounded-xl px-4 py-3.5 text-sm font-medium border transition-colors
                        ${picked ? 'border-accent-violet bg-accent-violet/15 text-text-primary' : 'border-bg-border bg-bg-elevated hover:border-accent-violet/60 text-text-primary'}
                        ${answered[question.id] && !picked ? 'opacity-40' : ''}
                      `}
                    >
                      <span className="uppercase text-xs text-text-faint mr-2">{opt}</span>{text}
                    </button>
                  )
                })}
              </div>
            )}

            {isHost && (
              <div className="mb-6 text-sm text-text-muted">
                {players.length} player{players.length === 1 ? '' : 's'} in game · watch the live leaderboard on the right.
              </div>
            )}

            {lastResult && !isHost && (
              <div className={`mb-4 rounded-lg border px-3 py-2.5 text-sm flex items-center gap-2 ${lastResult.correct ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'}`}>
                <CheckCircle2 size={15} /> {lastResult.correct ? `Correct! +${lastResult.points} points` : 'Not quite — 0 points'}
              </div>
            )}

            {isHost && (
              <button onClick={nextQuestion} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim">
                {game.current_question >= questions.length - 1 ? 'Finish game' : 'Next question'} <ChevronRight size={15} />
              </button>
            )}
          </div>
        )}

        {game.status === 'finished' && (
          <div className="glass-card rounded-3xl p-8 text-center">
            <Trophy className="mx-auto text-accent-amber mb-3" size={40} />
            <h2 className="font-display text-2xl text-text-primary mb-1">Game over!</h2>
            <p className="text-text-muted mb-6">Final standings are on the right.</p>
            <div className="flex justify-center gap-3">
              <Link to="/dashboard" className="px-4 py-2.5 rounded-lg glass-card text-sm font-semibold hover:border-accent-violet/50">Back to dashboard</Link>
              <Link to="/leaderboard" className="px-4 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim">Global leaderboard</Link>
            </div>
          </div>
        )}
      </div>

      {/* live leaderboard sidebar */}
      <div>
        <div className="glass-card rounded-2xl p-4 sticky top-20">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-1.5 text-sm"><Users size={14} /> Players ({players.length})</h3>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${p.user_id === profile?.id ? 'bg-accent-violet/10' : 'bg-bg-elevated/60'}`}>
                <span className="w-4 text-center text-xs text-text-faint">{i === 0 && game.status !== 'lobby' ? <Crown size={13} className="text-accent-amber" /> : i + 1}</span>
                <span className="flex-1 truncate text-text-primary">{p.player_name}</span>
                <span className="font-display text-accent-amber text-xs">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
