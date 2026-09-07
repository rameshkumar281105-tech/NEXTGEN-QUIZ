import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { KeyRound, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function JoinQuiz() {
  const { pin: pinParam } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { show } = useToast()

  const [pin, setPin] = useState(pinParam && pinParam !== '000000' ? pinParam : '')
  const [playerName, setPlayerName] = useState(profile?.name ?? '')
  const [gameInfo, setGameInfo] = useState<{ id: string; title: string; category: string; players: number } | null>(null)
  const [checking, setChecking] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pin.length === 6) checkPin(pin)
    else setGameInfo(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const checkPin = async (value: string) => {
    setChecking(true)
    setError(null)
    const { data: game } = await supabase
      .from('multiplayer_games')
      .select('id, status, quizzes(title, category), game_players(count)')
      .eq('game_pin', value)
      .eq('status', 'lobby')
      .maybeSingle()

    if (!game) {
      setGameInfo(null)
      setError('No open game found for that PIN. Double-check it with the host.')
      setChecking(false)
      return
    }
    setGameInfo({
      id: game.id,
      title: (game as any).quizzes?.title ?? 'Untitled quiz',
      category: (game as any).quizzes?.category ?? '',
      players: (game as any).game_players?.[0]?.count ?? 0,
    })
    setChecking(false)
  }

  const join = async () => {
    if (!gameInfo || !playerName.trim()) return
    setJoining(true)
    const { data, error } = await supabase.rpc('join_multiplayer_game', {
      p_pin: pin,
      p_player_name: playerName.trim(),
    })
    setJoining(false)
    if (error || !data) {
      show(error?.message ?? 'Could not join the game.', 'error')
      return
    }
    show('Joined! Waiting for the host to start.', 'success')
    navigate(`/game/${data}`)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-3xl p-8">
        <span className="grid place-items-center h-12 w-12 rounded-2xl bg-accent-violet/15 text-accent-violet mx-auto mb-4">
          <KeyRound size={20} />
        </span>
        <h1 className="font-display text-2xl text-center mb-1 text-text-primary">Join a live quiz</h1>
        <p className="text-sm text-text-muted text-center mb-7">Enter the 6-digit PIN shared by your host.</p>

        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          className="w-full text-center tracking-[0.5em] text-2xl font-display rounded-xl bg-bg-elevated border border-bg-border px-3 py-4 outline-none focus:border-accent-violet/60 mb-4"
        />

        {checking && <LoadingSpinner />}
        {error && !checking && <p className="text-sm text-danger text-center mb-2">{error}</p>}

        {gameInfo && !checking && (
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 mb-4">
            <p className="font-semibold text-text-primary">{gameInfo.title}</p>
            <p className="text-xs text-text-muted mb-2">{gameInfo.category}</p>
            <p className="text-xs flex items-center gap-1.5 text-success"><Users size={13} /> {gameInfo.players} player{gameInfo.players === 1 ? '' : 's'} waiting</p>

            <label className="text-xs font-medium text-text-muted mt-4 mb-1.5 block">Your display name</label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Name shown to other players"
              className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3.5 py-2.5 text-sm outline-none focus:border-accent-violet/60 mb-4"
            />

            <button
              onClick={join}
              disabled={joining || !playerName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join game'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
