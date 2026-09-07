import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  Clock,
  ListChecks,
  Play,
  PenSquare,
  Trash2,
  SlidersHorizontal,
  Shuffle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playRandomQuiz } from '../lib/randomQuiz'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { CATEGORIES, type Quiz } from '../types'

const difficultyColor: Record<string, string> = {
  easy: 'text-success bg-success/10 border-success/30',
  medium:
    'text-accent-amber bg-accent-amber/10 border-accent-amber/30',
  hard:
    'text-danger bg-danger/10 border-danger/30',
}

/*
 * These are the six original quizzes inserted by seed.sql.
 *
 * They are protected from deletion because they are part of
 * the original application quiz collection.
 */
const ORIGINAL_QUIZ_TITLES = new Set([
  'World Capitals & Facts',
  'Everyday Science',
  'Tech Fundamentals',
  'Milestones in History',
  'Sports Trivia Mix',
  'Global Awareness Basics',
])

export default function Quizzes() {
  const { user } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')

  const [category, setCategory] = useState(
    params.get('category') ?? ''
  )

  const [difficulty, setDifficulty] = useState('')

  const [scope, setScope] = useState<'public' | 'mine'>(
    'public'
  )

  /*
   * Load quizzes.
   */
  useEffect(() => {
    const load = async () => {
      setLoading(true)

      let query = supabase
        .from('quizzes')
        .select(
          '*, questions(count), profiles!quizzes_creator_id_fkey(name)'
        )
        .order('created_at', {
          ascending: false,
        })

      if (scope === 'mine' && user) {
        query = query.eq(
          'creator_id',
          user.id
        )
      } else {
        query = query
          .eq('is_public', true)
          .eq('published', true)
      }

      const { data, error } = await query

      if (error) {
        console.error(
          'Failed to load quizzes:',
          error
        )

        show(
          `Could not load quizzes: ${error.message}`,
          'error'
        )

        setQuizzes([])
      } else if (data) {
        setQuizzes(
          data.map((q: any) => ({
            ...q,

            question_count:
              q.questions?.[0]?.count ?? 0,

            creator_name:
              q.profiles?.name ?? 'Unknown',
          }))
        )
      }

      setLoading(false)
    }

    load()
  }, [scope, user, show])

  /*
   * Keep category synchronized with URL.
   */
  useEffect(() => {
    const c = params.get('category')

    setCategory(c ?? '')
  }, [params])

  /*
   * Check whether this is one of the six original
   * application quizzes.
   */
  const isOriginalQuiz = (quiz: Quiz) => {
    return ORIGINAL_QUIZ_TITLES.has(
      quiz.title.trim()
    )
  }

  /*
   * Delete only quizzes created through the website.
   *
   * The six original seeded quizzes are protected.
   */
  const deleteQuiz = async (quiz: Quiz) => {
    if (isOriginalQuiz(quiz)) {
      show(
        'The original six quizzes cannot be deleted.',
        'error'
      )
      return
    }

    if (!user) {
      show(
        'Please log in first.',
        'error'
      )
      return
    }

    const confirmed = window.confirm(
      `Delete "${quiz.title}" permanently?\n\nThis will delete the quiz and its questions. This cannot be undone.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quiz.id)
      .eq('creator_id', user.id)

    if (error) {
      show(
        `Could not delete quiz: ${error.message}`,
        'error'
      )
      return
    }

    setQuizzes((current) =>
      current.filter(
        (q) => q.id !== quiz.id
      )
    )

    show(
      'Quiz deleted successfully.',
      'success'
    )
  }

  /*
   * Search + category + difficulty filtering.
   */
  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      if (
        search &&
        !q.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      ) {
        return false
      }

      if (
        category &&
        q.category !== category
      ) {
        return false
      }

      if (
        difficulty &&
        q.difficulty !== difficulty
      ) {
        return false
      }

      return true
    })
  }, [
    quizzes,
    search,
    category,
    difficulty,
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">

        <div>
          <h1 className="font-display text-3xl text-text-primary mb-1">
            Quizzes
          </h1>

          <p className="text-text-muted">
            Browse public quizzes or manage the ones you've created.
          </p>
        </div>

        {/* ONLY RANDOM + CREATE HERE */}
        <div className="flex gap-2 shrink-0">

          <button
            type="button"
            onClick={() =>
              playRandomQuiz(
                navigate,
                show
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg glass-card text-sm font-semibold hover:border-accent-violet/50 transition-colors"
          >
            <Shuffle size={16} />
            Random quiz
          </button>

          {user && (
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim transition-colors"
            >
              <PenSquare size={16} />
              Create quiz
            </Link>
          )}

        </div>
      </div>

      {/* ============================================================
          SCOPE TABS
      ============================================================ */}

      <div className="inline-flex glass-card rounded-xl p-1 mb-6">

        <button
          type="button"
          onClick={() =>
            setScope('public')
          }
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scope === 'public'
              ? 'bg-accent-violet text-white'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Public quizzes
        </button>

        <button
          type="button"
          onClick={() =>
            setScope('mine')
          }
          disabled={!user}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
            scope === 'mine'
              ? 'bg-accent-violet text-white'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          My quizzes
        </button>

      </div>

      {/* ============================================================
          FILTERS
      ============================================================ */}

      <div className="glass-card rounded-2xl p-4 mb-8 grid sm:grid-cols-[1fr_auto_auto] gap-3">

        {/* SEARCH */}

        <div className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-bg-border px-3">

          <Search
            size={16}
            className="text-text-faint"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search quizzes..."
            className="bg-transparent py-2.5 w-full text-sm outline-none placeholder:text-text-faint"
          />

        </div>

        {/* CATEGORY */}

        <select
          value={category}
          onChange={(e) => {
            const value =
              e.target.value

            setCategory(value)

            setParams(
              value
                ? {
                    category: value,
                  }
                : {}
            )
          }}
          className="rounded-xl bg-bg-elevated border border-bg-border px-3 py-2.5 text-sm text-text-primary outline-none"
        >
          <option value="">
            All categories
          </option>

          {CATEGORIES.map(
            (c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            )
          )}
        </select>

        {/* DIFFICULTY */}

        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(
              e.target.value
            )
          }
          className="rounded-xl bg-bg-elevated border border-bg-border px-3 py-2.5 text-sm text-text-primary outline-none"
        >
          <option value="">
            All difficulties
          </option>

          <option value="easy">
            Easy
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="hard">
            Hard
          </option>
        </select>

      </div>

      {/* ============================================================
          CONTENT
      ============================================================ */}

      {loading ? (

        <LoadingSpinner full />

      ) : filtered.length === 0 ? (

        <EmptyState
          icon={
            <SlidersHorizontal
              size={26}
            />
          }
          title="No quizzes found"
          message={
            scope === 'mine'
              ? "You haven't created any quizzes yet."
              : 'Try a different search or filter.'
          }
          action={
            scope === 'mine' ? (
              <Link
                to="/create"
                className="mt-2 px-4 py-2 rounded-lg bg-accent-violet text-white text-sm font-semibold"
              >
                Create your first quiz
              </Link>
            ) : undefined
          }
        />

      ) : (

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {filtered.map(
            (q) => {

              const original =
                isOriginalQuiz(q)

              return (

                <div
                  key={q.id}
                  className="glass-card rounded-2xl p-5 flex flex-col"
                >

                  {/* CATEGORY + DIFFICULTY */}

                  <div className="flex items-center justify-between mb-3">

                    <span className="text-xs font-medium text-accent-cyan bg-accent-cyan/10 px-2.5 py-1 rounded-full">
                      {q.category}
                    </span>

                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                        difficultyColor[
                          q.difficulty
                        ] ??
                        'text-text-muted bg-bg-elevated border-bg-border'
                      }`}
                    >
                      {q.difficulty}
                    </span>

                  </div>

                  {/* TITLE */}

                  <h3 className="font-display text-lg text-text-primary mb-1">
                    {q.title}
                  </h3>

                  {/* DESCRIPTION */}

                  <p className="text-sm text-text-muted mb-4 line-clamp-2 flex-1">
                    {q.description ||
                      'No description provided.'}
                  </p>

                  {/* INFO */}

                  <div className="flex items-center gap-4 text-xs text-text-muted mb-4">

                    <span className="flex items-center gap-1">
                      <ListChecks
                        size={13}
                      />

                      {q.question_count ??
                        0}{' '}
                      questions
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock
                        size={13}
                      />

                      {q.time_limit ??
                        0}
                      s / question
                    </span>

                  </div>

                  {/* ==================================================
                      FOOTER
                  ================================================== */}

                  <div className="flex items-center justify-between gap-2">

                    <span className="text-xs text-text-faint truncate">
                      by{' '}
                      {q.creator_name ??
                        'Unknown'}
                    </span>

                    <div className="flex items-center gap-2">

                      {scope === 'mine' ? (

                        <>
                          {/* ORIGINAL QUIZ:
                              NO DELETE BUTTON */}

                          {original ? (

                            <span className="text-[11px] text-text-faint">
                              Original quiz
                            </span>

                          ) : (

                            /* NEW WEBSITE QUIZ:
                               DELETE ALLOWED */

                            <button
                              type="button"
                              onClick={() =>
                                deleteQuiz(
                                  q
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-semibold hover:bg-danger/20 transition-colors"
                              aria-label={`Delete quiz ${q.title}`}
                              title="Delete quiz"
                            >
                              <Trash2
                                size={13}
                              />
                              Delete
                            </button>

                          )}
                        </>

                      ) : (

                        <Link
                          to={`/quiz/${q.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-violet text-white text-xs font-semibold hover:bg-accent-violetDim transition-colors"
                        >
                          <Play
                            size={13}
                          />
                          Play
                        </Link>

                      )}

                    </div>

                  </div>

                  {/* DRAFT */}

                  {!q.published &&
                    scope === 'mine' && (
                      <span className="mt-3 text-[11px] text-accent-amber">
                        Draft — not visible to others yet
                      </span>
                    )}

                </div>
              )
            }
          )}

        </div>
      )}

    </div>
  )
}