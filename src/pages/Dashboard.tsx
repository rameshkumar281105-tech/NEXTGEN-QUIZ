import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Trophy,
  Target,
  TrendingUp,
  Flame,
  Award,
  PlusCircle,
  KeyRound,
  ListChecks,
  BarChart3,
  Star,
  Zap,
  Radio,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playRandomQuiz } from '../lib/randomQuiz'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import type {
  QuizAttempt,
  Achievement,
} from '../types'

const XP_PER_LEVEL = 500

export default function Dashboard() {
  const { profile } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] =
    useState(true)

  const [attempts, setAttempts] =
    useState<QuizAttempt[]>([])

  const [unlocked, setUnlocked] =
    useState<
      (Achievement & {
        unlocked_at: string
      })[]
    >([])

  useEffect(() => {
    if (!profile) return

    const load = async () => {
      setLoading(true)

      const [
        { data: attemptData },
        { data: achData },
      ] = await Promise.all([

        supabase
          .from('quiz_attempts')
          .select(
            '*, quizzes(title)'
          )
          .eq(
            'user_id',
            profile.id
          )
          .order(
            'completed_at',
            {
              ascending: false,
            }
          )
          .limit(6),

        supabase
          .from('user_achievements')
          .select(
            'unlocked_at, achievements(*)'
          )
          .eq(
            'user_id',
            profile.id
          )
          .order(
            'unlocked_at',
            {
              ascending: false,
            }
          )
          .limit(6),

      ])

      setAttempts(
        (attemptData ?? []).map(
          (a: any) => ({
            ...a,
            quiz_title:
              a.quizzes?.title ??
              'Deleted quiz',
          })
        )
      )

      setUnlocked(
        (achData ?? [])
          .filter(
            (r: any) =>
              r.achievements
          )
          .map(
            (r: any) => ({
              ...r.achievements,
              unlocked_at:
                r.unlocked_at,
            })
          )
      )

      setLoading(false)
    }

    load()
  }, [profile])

  if (!profile) {
    return <LoadingSpinner full />
  }

  const totalPlayed =
    attempts.length

  const totalScore =
    attempts.reduce(
      (s, a) =>
        s + a.score,
      0
    )

  const avgScore =
    attempts.length
      ? Math.round(
          attempts.reduce(
            (s, a) =>
              s + a.percentage,
            0
          ) /
            attempts.length
        )
      : 0

  const bestScore =
    attempts.length
      ? Math.max(
          ...attempts.map(
            (a) =>
              a.percentage
          )
        )
      : 0

  const xpIntoLevel =
    profile.xp %
    XP_PER_LEVEL

  const levelProgress =
    Math.round(
      (xpIntoLevel /
        XP_PER_LEVEL) *
        100
    )

  const stats = [
    {
      label: 'Quizzes played',
      value: totalPlayed,
      icon: ListChecks,
      color: 'text-accent-cyan',
    },
    {
      label: 'Total score',
      value: totalScore,
      icon: Target,
      color: 'text-accent-violet',
    },
    {
      label: 'Average score',
      value: `${avgScore}%`,
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      label: 'Best score',
      value: `${bestScore}%`,
      icon: Star,
      color: 'text-accent-amber',
    },
    {
      label: 'Current streak',
      value: profile.streak,
      icon: Flame,
      color: 'text-danger',
    },
    {
      label: 'Level',
      value: profile.level,
      icon: Zap,
      color: 'text-accent-amber',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* ============================================================
          WELCOME
      ============================================================ */}

      <h1 className="font-display text-3xl text-text-primary mb-1">
        Welcome back,{' '}
        {profile.name.split(
          ' '
        )[0]}{' '}
        👋
      </h1>

      <p className="text-text-muted mb-8">
        Here's how your quizzing is going.
      </p>

      {/* ============================================================
          XP / LEVEL
      ============================================================ */}

      <div className="glass-card rounded-2xl p-5 mb-6 flex items-center gap-5">

        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent-amber to-accent-violet grid place-items-center font-display font-bold text-bg text-lg shrink-0">
          Lv{profile.level}
        </div>

        <div className="flex-1">

          <div className="flex justify-between text-xs text-text-muted mb-1.5">

            <span>
              {xpIntoLevel} /{' '}
              {XP_PER_LEVEL} XP
              to next level
            </span>

            <span>
              {profile.xp} XP total
            </span>

          </div>

          <div className="h-2 rounded-full bg-bg-border overflow-hidden">

            <div
              className="h-full bg-gradient-to-r from-accent-amber to-accent-violet transition-all"
              style={{
                width: `${levelProgress}%`,
              }}
            />

          </div>

        </div>
      </div>

      {/* ============================================================
          QUICK ACTIONS
      ============================================================ */}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">

        {/* QUICK START */}

        <button
          type="button"
          onClick={() =>
            playRandomQuiz(
              navigate,
              show
            )
          }
          className="glass-card rounded-xl px-4 py-4 flex flex-col items-center gap-2 hover:border-accent-violet/50 text-center transition-colors"
        >
          <Zap
            size={18}
            className="text-accent-violet"
          />

          <span className="text-xs font-medium text-text-primary">
            Quick Start
          </span>
        </button>

        {/* JOIN QUIZ */}

        <QuickAction
          to="/join/000000"
          icon={KeyRound}
          label="Join Quiz"
        />

        {/* ==========================================================
            NEW SEPARATE HOST TAB
        ========================================================== */}

        <Link
          to="/host"
          className="glass-card rounded-xl px-4 py-4 flex flex-col items-center gap-2 hover:border-accent-cyan/50 text-center transition-colors"
        >
          <Radio
            size={18}
            className="text-accent-cyan"
          />

          <span className="text-xs font-medium text-text-primary">
            Host Live
          </span>
        </Link>

        {/* CREATE */}

        <QuickAction
          to="/create"
          icon={PlusCircle}
          label="Create Quiz"
        />

        {/* LEADERBOARD */}

        <QuickAction
          to="/leaderboard"
          icon={Trophy}
          label="Leaderboard"
        />

      </div>

      {/* ============================================================
          HOST LIVE FEATURE PANEL
      ============================================================ */}

      <div className="glass-card rounded-2xl p-5 mb-10 border border-accent-cyan/20">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <div className="h-12 w-12 rounded-xl bg-accent-cyan/10 grid place-items-center shrink-0">

              <Radio
                size={22}
                className="text-accent-cyan"
              />

            </div>

            <div>

              <h2 className="font-display text-lg text-text-primary">
                Host a Live Quiz
              </h2>

              <p className="text-sm text-text-muted">
                Choose your quiz, generate a PIN and let players join your live game.
              </p>

            </div>

          </div>

          <Link
            to="/host"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent-cyan text-bg text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Radio size={15} />
            Host Live
          </Link>

        </div>

      </div>

      {/* ============================================================
          STATS
      ============================================================ */}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-10">

        {stats.map(
          (s) => (
            <div
              key={s.label}
              className="glass-card rounded-2xl p-4"
            >

              <s.icon
                size={16}
                className={s.color}
              />

              <p className="font-display text-xl text-text-primary mt-2">
                {s.value}
              </p>

              <p className="text-xs text-text-muted">
                {s.label}
              </p>

            </div>
          )
        )}

      </div>

      {/* ============================================================
          RECENT + ACHIEVEMENTS
      ============================================================ */}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ==========================================================
            RECENT QUIZZES
        ========================================================== */}

        <div className="lg:col-span-2">

          <div className="flex items-center justify-between mb-4">

            <h2 className="font-display text-lg text-text-primary">
              Recent quizzes
            </h2>

            <Link
              to="/performance"
              className="text-xs text-accent-cyan hover:underline"
            >
              View all
            </Link>

          </div>

          {loading ? (

            <LoadingSpinner />

          ) : attempts.length === 0 ? (

            <EmptyState
              icon={
                <BarChart3
                  size={28}
                />
              }
              title="No attempts yet"
              message="Play your first quiz to see your results here."
              action={
                <Link
                  to="/quizzes"
                  className="mt-2 px-4 py-2 rounded-lg bg-accent-violet text-white text-sm font-semibold"
                >
                  Browse quizzes
                </Link>
              }
            />

          ) : (

            <div className="space-y-3">

              {attempts.map(
                (a) => (

                  <Link
                    key={a.id}
                    to={`/results/${a.id}`}
                    className="glass-card rounded-xl p-4 flex items-center justify-between hover:border-accent-violet/50 block"
                  >

                    <div>

                      <p className="text-sm font-medium text-text-primary">
                        {a.quiz_title}
                      </p>

                      <p className="text-xs text-text-muted">
                        {new Date(
                          a.completed_at
                        ).toLocaleDateString()}{' '}
                        ·{' '}
                        {a.correct_answers}{' '}
                        correct
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="font-display text-lg text-text-primary">
                        {a.percentage}%
                      </p>

                      <p className="text-xs text-accent-amber">
                        +{a.xp_earned}{' '}
                        XP
                      </p>

                    </div>

                  </Link>

                )
              )}

            </div>
          )}

        </div>

        {/* ==========================================================
            ACHIEVEMENTS
        ========================================================== */}

        <div>

          <div className="flex items-center justify-between mb-4">

            <h2 className="font-display text-lg text-text-primary">
              Achievements
            </h2>

            <Link
              to="/rewards"
              className="text-xs text-accent-cyan hover:underline"
            >
              View all
            </Link>

          </div>

          {loading ? (

            <LoadingSpinner />

          ) : unlocked.length === 0 ? (

            <EmptyState
              icon={
                <Award
                  size={26}
                />
              }
              title="No badges yet"
              message="Play quizzes to start unlocking achievements."
            />

          ) : (

            <div className="space-y-3">

              {unlocked.map(
                (a) => (

                  <div
                    key={a.id}
                    className="glass-card rounded-xl p-4 flex items-center gap-3"
                  >

                    <span className="h-10 w-10 rounded-xl bg-accent-amber/15 text-accent-amber grid place-items-center text-lg">
                      {a.icon}
                    </span>

                    <div>

                      <p className="text-sm font-medium text-text-primary">
                        {a.name}
                      </p>

                      <p className="text-xs text-text-muted">
                        {a.description}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

/* ================================================================
   QUICK ACTION COMPONENT
================================================================ */

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: React.ElementType
  label: string
}) {
  return (
    <Link
      to={to}
      className="glass-card rounded-xl px-4 py-4 flex flex-col items-center gap-2 hover:border-accent-violet/50 text-center transition-colors"
    >
      <Icon
        size={18}
        className="text-accent-violet"
      />

      <span className="text-xs font-medium text-text-primary">
        {label}
      </span>
    </Link>
  )
}