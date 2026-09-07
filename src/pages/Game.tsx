import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Users,
  Copy,
  Play,
  ChevronRight,
  Trophy,
  Timer,
  Crown,
  CheckCircle2,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

import type {
  GamePlayer,
  MultiplayerGame,
  Question,
  Quiz,
} from '../types'

type OptionKey = 'a' | 'b' | 'c' | 'd'

export default function Game() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { show } = useToast()

  const [game, setGame] = useState<MultiplayerGame | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [loading, setLoading] = useState(true)

  const [timeLeft, setTimeLeft] = useState(0)

  const [answered, setAnswered] = useState<
    Record<string, OptionKey>
  >({})

  const [lastResult, setLastResult] = useState<{
    correct: boolean
    points: number
  } | null>(null)

  /*
   * The exact database time at which the current
   * question started.
   */
  const questionStartRef = useRef<number | null>(null)

  /*
   * Prevents the host from advancing the same
   * question multiple times.
   */
  const autoAdvanceKeyRef = useRef<string | null>(null)

  /*
   * Prevents duplicate RPC requests.
   */
  const advancingRef = useRef(false)

  /*
   * IMPORTANT:
   * Always make this a real boolean.
   */
  const isHost = Boolean(
    game &&
      profile &&
      game.host_id === profile.id
  )

  const question =
    game && questions.length > 0
      ? questions[game.current_question]
      : undefined

  /* ================================================================
     LOAD GAME
  ================================================================ */

  useEffect(() => {
    if (!id || !profile) return

    let cancelled = false

    const loadGame = async () => {
      setLoading(true)

      const {
        data: gameData,
        error: gameError,
      } = await supabase
        .from('multiplayer_games')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (gameError) {
        console.error(
          'Game loading error:',
          gameError
        )
      }

      if (cancelled) return

      if (!gameData) {
        setLoading(false)
        return
      }

      const [
        quizResult,
        questionsResult,
        playersResult,
      ] = await Promise.all([
        supabase
          .from('quizzes')
          .select('*')
          .eq('id', gameData.quiz_id)
          .maybeSingle(),

        supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', gameData.quiz_id)
          .order('question_order', {
            ascending: true,
          }),

        supabase
          .from('game_players')
          .select('*')
          .eq('game_id', id)
          .order('joined_at', {
            ascending: true,
          }),
      ])

      if (cancelled) return

      setGame(
        gameData as MultiplayerGame
      )

      setQuiz(
        quizResult.data as Quiz
      )

      setQuestions(
        (questionsResult.data ??
          []) as Question[]
      )

      setPlayers(
        (playersResult.data ??
          []) as GamePlayer[]
      )

      setLoading(false)
    }

    void loadGame()

    return () => {
      cancelled = true
    }
  }, [id, profile])

  /* ================================================================
     REALTIME UPDATES
  ================================================================ */

  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`game-${id}`)

      /*
       * GAME UPDATE
       */
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_games',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updatedGame =
            payload.new as MultiplayerGame

          setGame(updatedGame)

          /*
           * New question = reset answer/result.
           */
          setAnswered({})
          setLastResult(null)

          /*
           * Allow automatic timer handling
           * for the new question.
           */
          autoAdvanceKeyRef.current = null
          advancingRef.current = false
        }
      )

      /*
       * NEW PLAYER
       */
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${id}`,
        },
        (payload) => {
          const newPlayer =
            payload.new as GamePlayer

          setPlayers((current) => {
            if (
              current.some(
                (player) =>
                  player.id ===
                  newPlayer.id
              )
            ) {
              return current
            }

            return [
              ...current,
              newPlayer,
            ]
          })
        }
      )

      /*
       * PLAYER SCORE UPDATE
       */
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${id}`,
        },
        (payload) => {
          const updatedPlayer =
            payload.new as GamePlayer

          setPlayers((current) =>
            current.map((player) =>
              player.id ===
              updatedPlayer.id
                ? updatedPlayer
                : player
            )
          )
        }
      )

      .subscribe()

    return () => {
      void supabase.removeChannel(
        channel
      )
    }
  }, [id])

  /* ================================================================
     TIMER + AUTOMATIC NEXT QUESTION
  ================================================================ */

  useEffect(() => {
    /*
     * Nothing to count down in lobby/finished state.
     */
    if (
      !game ||
      !quiz ||
      game.status !== 'active'
    ) {
      questionStartRef.current = null
      setTimeLeft(0)
      return
    }

    /*
     * VERY IMPORTANT:
     *
     * Do not start the timer from Date.now()
     * if question_started_at isn't available yet.
     *
     * Otherwise Question 1 can incorrectly start
     * with 0 seconds.
     */
    if (!game.question_started_at) {
      questionStartRef.current = null

      /*
       * Display the full time while waiting for
       * the database timestamp.
       */
      setTimeLeft(
        quiz.time_limit
      )

      return
    }

    const startedAt =
      new Date(
        game.question_started_at
      ).getTime()

    /*
     * Invalid timestamp protection.
     */
    if (!Number.isFinite(startedAt)) {
      questionStartRef.current = null

      setTimeLeft(
        quiz.time_limit
      )

      return
    }

    /*
     * Save official start time.
     */
    questionStartRef.current =
      startedAt

    /*
     * Unique ID for this question.
     */
    const questionKey =
      `${game.id}-${game.current_question}`

    /*
     * If this is a new question, allow it
     * to automatically advance when its timer ends.
     */
    if (
      autoAdvanceKeyRef.current !==
      questionKey
    ) {
      autoAdvanceKeyRef.current =
        null
    }

    /*
     * Calculate the countdown.
     *
     * IMPORTANT:
     * Automatic advance is performed INSIDE this
     * timer function after remaining time is actually
     * calculated.
     */
    const tick = async () => {
      const elapsed =
        (Date.now() - startedAt) /
        1000

      const remaining =
        Math.max(
          0,
          Math.ceil(
            quiz.time_limit -
              elapsed
          )
        )

      /*
       * Update UI.
       */
      setTimeLeft(
        remaining
      )

      /*
       * Only the HOST controls the game progression.
       */
      if (
        !isHost ||
        remaining > 0 ||
        autoAdvanceKeyRef.current ===
          questionKey ||
        advancingRef.current
      ) {
        return
      }

      /*
       * Mark this question as being advanced
       * BEFORE making the RPC request.
       */
      autoAdvanceKeyRef.current =
        questionKey

      advancingRef.current = true

      try {
        const { error } =
          await supabase.rpc(
            'advance_multiplayer_game',
            {
              p_game_id: game.id,
            }
          )

        if (error) {
          console.error(
            'Automatic advance error:',
            error
          )

          autoAdvanceKeyRef.current =
            null

          show(
            `Could not move to the next question: ${error.message}`,
            'error'
          )
        }
      } finally {
        advancingRef.current = false
      }
    }

    /*
     * Run once immediately.
     *
     * This does NOT skip Question 1 because
     * remaining is calculated from the database
     * question_started_at timestamp.
     */
    void tick()

    /*
     * Continue updating every 250ms.
     */
    const interval =
      window.setInterval(() => {
        void tick()
      }, 250)

    return () => {
      window.clearInterval(
        interval
      )
    }
  }, [
    game?.id,
    game?.status,
    game?.current_question,
    game?.question_started_at,
    quiz?.time_limit,
    isHost,
    show,
  ])

  /* ================================================================
     COPY PIN
  ================================================================ */

  const copyPin = () => {
    if (!game) return

    void navigator.clipboard.writeText(
      game.game_pin
    )

    show(
      'Game PIN copied to clipboard.',
      'success'
    )
  }

  /* ================================================================
     COPY JOIN LINK
  ================================================================ */

  const copyLink = () => {
    if (!game) return

    const joinLink =
      `${window.location.origin}/join/${game.game_pin}`

    void navigator.clipboard.writeText(
      joinLink
    )

    show(
      'Join link copied.',
      'success'
    )
  }

  /* ================================================================
     HOST START GAME
  ================================================================ */

  const startGame = async () => {
    if (
      !game ||
      !isHost
    ) {
      return
    }

    /*
     * Reset timer protection before starting.
     */
    questionStartRef.current = null
    autoAdvanceKeyRef.current = null
    advancingRef.current = false

    const { error } =
      await supabase.rpc(
        'start_multiplayer_game',
        {
          p_game_id: game.id,
        }
      )

    if (error) {
      show(
        error.message,
        'error'
      )
    }
  }

  /* ================================================================
     MANUAL NEXT QUESTION
  ================================================================ */

  const nextQuestion = async () => {
    if (
      !game ||
      !isHost ||
      game.status !== 'active'
    ) {
      return
    }

    if (advancingRef.current) {
      return
    }

    const questionKey =
      `${game.id}-${game.current_question}`

    /*
     * Mark as advancing so the timer doesn't
     * simultaneously call the RPC.
     */
    autoAdvanceKeyRef.current =
      questionKey

    advancingRef.current = true

    try {
      const { error } =
        await supabase.rpc(
          'advance_multiplayer_game',
          {
            p_game_id: game.id,
          }
        )

      if (error) {
        autoAdvanceKeyRef.current =
          null

        show(
          error.message,
          'error'
        )
      }
    } finally {
      advancingRef.current = false
    }
  }

  /* ================================================================
     PLAYER SUBMIT ANSWER
  ================================================================ */

  const submitAnswer = async (
    option: OptionKey
  ) => {
    /*
     * Host cannot answer.
     */
    if (isHost) {
      return
    }

    if (
      !game ||
      !question ||
      game.status !== 'active'
    ) {
      return
    }

    /*
     * Prevent multiple answers.
     */
    if (
      answered[question.id]
    ) {
      return
    }

    /*
     * Prevent answers after timer.
     */
    if (timeLeft <= 0) {
      return
    }

    const startTime =
      questionStartRef.current

    if (startTime === null) {
      return
    }

    const responseTime =
      Math.round(
        (
          (Date.now() -
            startTime) /
          1000
        ) * 10
      ) / 10

    /*
     * Immediately disable other options.
     */
    setAnswered(
      (current) => ({
        ...current,
        [question.id]:
          option,
      })
    )

    const { data, error } =
      await supabase.rpc(
        'submit_multiplayer_answer',
        {
          p_game_id: game.id,
          p_question_id:
            question.id,
          p_selected_answer:
            option,
          p_response_time:
            responseTime,
        }
      )

    if (error) {
      /*
       * Restore buttons if submission failed.
       */
      setAnswered(
        (current) => {
          const next = {
            ...current,
          }

          delete next[
            question.id
          ]

          return next
        }
      )

      show(
        error.message,
        'error'
      )

      return
    }

    setLastResult({
      correct: Boolean(
        (data as any)
          ?.is_correct
      ),
      points: Number(
        (data as any)
          ?.points ?? 0
      ),
    })
  }

  /* ================================================================
     LEADERBOARD
  ================================================================ */

  const sortedPlayers =
    [...players].sort(
      (a, b) =>
        b.score - a.score
    )

  /* ================================================================
     LOADING
  ================================================================ */

  if (loading) {
    return (
      <LoadingSpinner full />
    )
  }

  /* ================================================================
     GAME NOT FOUND
  ================================================================ */

  if (!game || !quiz) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-text-muted">
          Game not found.
        </p>

        <Link
          to="/dashboard"
          className="inline-block mt-4 text-accent-cyan hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  /* ================================================================
     MAIN UI
  ================================================================ */

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">

        {/* ==========================================================
            MAIN CONTENT
        ========================================================== */}

        <main>

          {/* HEADER */}

          <div className="flex items-center justify-between mb-6">

            <div>

              <h1 className="font-display text-2xl text-text-primary">
                {quiz.title}
              </h1>

              <p className="text-sm text-text-muted mt-1">

                {game.status ===
                'lobby'
                  ? 'Waiting for players'
                  : game.status ===
                    'active'
                  ? `Question ${
                      game.current_question +
                      1
                    } of ${
                      questions.length
                    }`
                  : 'Game finished'}

              </p>

            </div>

            {/* TIMER */}

            {game.status ===
              'active' && (

              <div
                className={`
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  border
                  ${
                    timeLeft <= 5
                      ? 'border-danger/40 text-danger'
                      : 'border-bg-border text-text-primary'
                  }
                `}
              >

                <Timer size={18} />

                <span className="font-display text-xl">
                  {timeLeft}s
                </span>

              </div>

            )}

          </div>

          {/* ========================================================
              LOBBY
          ======================================================== */}

          {game.status ===
            'lobby' && (

            <div className="glass-card rounded-3xl p-8 text-center">

              <p className="text-xs uppercase tracking-wider text-text-muted mb-2">
                Game PIN
              </p>

              <div className="flex items-center justify-center gap-3">

                <span className="font-display text-5xl tracking-[0.2em] text-gradient">
                  {game.game_pin}
                </span>

                <button
                  type="button"
                  onClick={copyPin}
                  className="p-2.5 rounded-lg glass-card hover:border-accent-violet/50"
                >
                  <Copy size={17} />
                </button>

              </div>

              <button
                type="button"
                onClick={copyLink}
                className="mt-3 text-sm text-accent-cyan hover:underline"
              >
                Copy join link
              </button>

              <div className="mt-8">

                {isHost ? (

                  <button
                    type="button"
                    onClick={startGame}
                    disabled={
                      players.length ===
                      0
                    }
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim disabled:opacity-40 disabled:cursor-not-allowed"
                  >

                    <Play size={17} />

                    Start game

                  </button>

                ) : (

                  <p className="text-sm text-text-muted">
                    Waiting for the host to start the game...
                  </p>

                )}

              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-text-muted">

                <Users size={16} />

                {players.length}{' '}
                player
                {players.length ===
                1
                  ? ''
                  : 's'} joined

              </div>

            </div>

          )}

          {/* ========================================================
              ACTIVE QUESTION
          ======================================================== */}

          {game.status ===
            'active' &&
            question && (

            <div className="glass-card rounded-3xl p-7">

              {/* TIMER BAR */}

              <div className="h-2 rounded-full bg-bg-border overflow-hidden mb-7">

                <div
                  className="h-full bg-gradient-to-r from-accent-violet to-accent-cyan transition-all duration-200"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (timeLeft /
                          Math.max(
                            1,
                            quiz.time_limit
                          )) *
                          100
                      )
                    )}%`,
                  }}
                />

              </div>

              {/* HOST LABEL */}

              {isHost && (

                <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-lg bg-accent-violet/10 text-accent-violet text-xs font-semibold">

                  <Crown size={13} />

                  Host view

                </div>

              )}

              {/* QUESTION */}

              <h2 className="font-display text-2xl leading-relaxed text-text-primary mb-7">
                {question.question_text}
              </h2>

              {/* ====================================================
                  OPTIONS
                  BOTH HOST AND PLAYER SEE OPTIONS
              ==================================================== */}

              <div className="grid sm:grid-cols-2 gap-4">

                {(
                  [
                    'a',
                    'b',
                    'c',
                    'd',
                  ] as OptionKey[]
                ).map(
                  (option) => {

                    const optionText =
                      question[
                        `option_${option}` as const
                      ]

                    const selected =
                      answered[
                        question.id
                      ] === option

                    const hasAnswered =
                      Boolean(
                        answered[
                          question.id
                        ]
                      )

                    return (

                      <button
                        key={option}
                        type="button"
                        disabled={
                          isHost ||
                          hasAnswered ||
                          timeLeft <= 0
                        }
                        onClick={() => {
                          if (!isHost) {
                            void submitAnswer(
                              option
                            )
                          }
                        }}
                        className={`
                          w-full
                          min-h-[78px]
                          text-left
                          rounded-xl
                          px-5
                          py-4
                          border
                          transition-all

                          ${
                            selected
                              ? 'border-accent-violet bg-accent-violet/15'
                              : 'border-bg-border bg-bg-elevated'
                          }

                          ${
                            isHost
                              ? 'cursor-default'
                              : 'hover:border-accent-violet/60 hover:-translate-y-0.5'
                          }

                          ${
                            hasAnswered &&
                            !selected
                              ? 'opacity-40'
                              : ''
                          }

                          ${
                            timeLeft <=
                            0
                              ? 'opacity-40'
                              : ''
                          }
                        `}
                      >

                        <div className="flex items-start gap-3">

                          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-bg-border flex items-center justify-center text-xs font-bold uppercase text-text-muted">
                            {option}
                          </span>

                          <span className="text-sm font-medium text-text-primary pt-1">
                            {optionText}
                          </span>

                        </div>

                      </button>

                    )
                  }
                )}

              </div>

              {/* HOST STATUS */}

              {isHost && (

                <div className="mt-6 rounded-xl border border-bg-border bg-bg-elevated/60 p-4">

                  <div className="flex items-center gap-2 text-sm text-text-primary font-semibold">

                    <Users size={16} />

                    {players.length}{' '}
                    player
                    {players.length ===
                    1
                      ? ''
                      : 's'} playing

                  </div>

                  <p className="text-xs text-text-muted mt-1">
                    The host can see the options but cannot answer. When the timer reaches 0, the next question opens automatically.
                  </p>

                </div>

              )}

              {/* PLAYER RESULT */}

              {!isHost &&
                lastResult && (

                <div
                  className={`
                    mt-6
                    rounded-xl
                    border
                    p-4
                    flex
                    items-center
                    gap-3
                    ${
                      lastResult.correct
                        ? 'border-success/30 bg-success/10'
                        : 'border-danger/30 bg-danger/10'
                    }
                  `}
                >

                  <CheckCircle2
                    size={18}
                  />

                  <div>

                    <p className="text-sm font-semibold text-text-primary">

                      {lastResult.correct
                        ? 'Correct!'
                        : 'Incorrect'}

                    </p>

                    <p className="text-xs text-text-muted">

                      {lastResult.correct
                        ? `+${lastResult.points} points`
                        : '0 points'}

                    </p>

                  </div>

                </div>

              )}

              {/* HOST MANUAL CONTROL */}

              {isHost && (

                <div className="mt-6">

                  <button
                    type="button"
                    onClick={
                      nextQuestion
                    }
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim disabled:opacity-50"
                  >

                    {game.current_question >=
                    questions.length -
                      1
                      ? 'Finish game'
                      : 'Next question'}

                    <ChevronRight
                      size={16}
                    />

                  </button>

                  <p className="text-xs text-text-faint mt-2">
                    You can move manually, or wait for the timer to advance automatically.
                  </p>

                </div>

              )}

            </div>

          )}

          {/* ========================================================
              FINISHED
          ======================================================== */}

          {game.status ===
            'finished' && (

            <div className="glass-card rounded-3xl p-10 text-center">

              <Trophy
                size={48}
                className="mx-auto text-accent-amber mb-4"
              />

              <h2 className="font-display text-3xl text-text-primary">
                Game Over!
              </h2>

              <p className="text-text-muted mt-2 mb-7">
                The final leaderboard is shown on the right.
              </p>

              <div className="flex justify-center gap-3">

                <Link
                  to="/dashboard"
                  className="px-5 py-3 rounded-xl glass-card text-sm font-semibold hover:border-accent-violet/50"
                >
                  Dashboard
                </Link>

                <Link
                  to="/leaderboard"
                  className="px-5 py-3 rounded-xl bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim"
                >
                  Leaderboard
                </Link>

              </div>

            </div>

          )}

        </main>

        {/* ==========================================================
            LIVE LEADERBOARD
        ========================================================== */}

        <aside>

          <div className="glass-card rounded-2xl p-4 sticky top-20">

            <div className="flex items-center justify-between mb-4">

              <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">

                <Users size={16} />

                Live leaderboard

              </h3>

              <span className="text-xs text-text-muted">
                {players.length}
              </span>

            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto">

              {sortedPlayers.map(
                (player, index) => (

                  <div
                    key={player.id}
                    className={`
                      flex
                      items-center
                      gap-2
                      px-3
                      py-2.5
                      rounded-lg
                      ${
                        player.user_id ===
                        profile?.id
                          ? 'bg-accent-violet/10'
                          : 'bg-bg-elevated/60'
                      }
                    `}
                  >

                    <div className="w-6 text-center">

                      {index ===
                        0 &&
                      game.status !==
                        'lobby' ? (

                        <Crown
                          size={14}
                          className="mx-auto text-accent-amber"
                        />

                      ) : (

                        <span className="text-xs text-text-faint">
                          {index + 1}
                        </span>

                      )}

                    </div>

                    <span className="flex-1 truncate text-sm text-text-primary">
                      {player.player_name}
                    </span>

                    <span className="font-display text-sm text-accent-amber">
                      {player.score}
                    </span>

                  </div>

                )
              )}

              {players.length ===
                0 && (

                <p className="text-xs text-text-muted text-center py-5">
                  No players yet.
                </p>

              )}

            </div>

          </div>

        </aside>

      </div>

    </div>
  )
}