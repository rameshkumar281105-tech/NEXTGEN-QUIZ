import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus, Trash2, GripVertical, Save, Send, EyeOff, ArrowUp, ArrowDown, ListChecks,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { CATEGORIES, type Difficulty, type Question } from '../types'

type DraftQuestion = Omit<Question, 'id' | 'quiz_id'> & { id?: string; localId: string }

const emptyQuestion = (order: number): DraftQuestion => ({
  localId: crypto.randomUUID(),
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'a',
  explanation: '',
  points: 10,
  question_order: order,
})

export default function CreateQuiz() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { show } = useToast()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [timeLimit, setTimeLimit] = useState(30)
  const [isPublic, setIsPublic] = useState(true)
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState<string>('')
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion(0)])

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setLoading(true)
      const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', id).maybeSingle()
      const { data: qs } = await supabase.from('questions').select('*').eq('quiz_id', id).order('question_order')
      if (quiz) {
        setTitle(quiz.title); setDescription(quiz.description ?? ''); setCategory(quiz.category)
        setDifficulty(quiz.difficulty); setTimeLimit(quiz.time_limit); setIsPublic(quiz.is_public); setPublished(quiz.published)
        setQuestionsPerAttempt(quiz.questions_per_attempt ? String(quiz.questions_per_attempt) : '')
      }
      if (qs && qs.length) {
        setQuestions(qs.map((q: Question) => ({ ...q, localId: q.id })))
      }
      setLoading(false)
    }
    load()
  }, [id, isEdit])

  const updateQuestion = (localId: string, patch: Partial<DraftQuestion>) => {
    setQuestions((qs) => qs.map((q) => (q.localId === localId ? { ...q, ...patch } : q)))
  }

  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion(qs.length)])

  const removeQuestion = (localId: string) => {
    setQuestions((qs) => qs.filter((q) => q.localId !== localId).map((q, i) => ({ ...q, question_order: i })))
  }

  const move = (index: number, dir: -1 | 1) => {
    setQuestions((qs) => {
      const next = [...qs]
      const target = index + dir
      if (target < 0 || target >= next.length) return qs
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((q, i) => ({ ...q, question_order: i }))
    })
  }

  const validate = () => {
    if (!title.trim()) return 'Give your quiz a title.'
    if (!questions.length) return 'Add at least one question.'
    for (const q of questions) {
      if (!q.question_text.trim()) return 'Every question needs text.'
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) return 'Every question needs all four options.'
    }
    return null
  }

  const save = async (publish?: boolean) => {
    const err = validate()
    if (err) { show(err, 'error'); return }
    if (!profile) return
    setSaving(true)

    const payload = {
      creator_id: profile.id,
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      time_limit: timeLimit,
      is_public: isPublic,
      questions_per_attempt: (() => {
        const n = Number(questionsPerAttempt.trim())
        return questionsPerAttempt.trim() && !Number.isNaN(n) && n > 0 ? Math.min(n, questions.length) : null
      })(),
      published: publish ?? published,
    }

    let quizId = id
    if (isEdit) {
      const { error } = await supabase.from('quizzes').update(payload).eq('id', id)
      if (error) { console.error('quiz update error:', error); show(`Could not save changes: ${error.message}`, 'error'); setSaving(false); return }
      await supabase.from('questions').delete().eq('quiz_id', id)
    } else {
      const { data, error } = await supabase.from('quizzes').insert(payload).select().single()
      if (error || !data) { console.error('quiz insert error:', error); show(`Could not create quiz: ${error?.message ?? 'unknown error'}`, 'error'); setSaving(false); return }
      quizId = data.id
    }

    const rows = questions.map((q, i) => ({
      quiz_id: quizId,
      question_text: q.question_text.trim(),
      option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      points: q.points,
      question_order: i,
    }))
    const { error: qErr } = await supabase.from('questions').insert(rows)
    if (qErr) { console.error('questions insert error:', qErr); show(`Quiz saved but questions failed to save: ${qErr.message}`, 'error'); setSaving(false); return }

    setPublished(publish ?? published)
    setSaving(false)
    show(publish ? 'Quiz published!' : 'Quiz saved as draft.', 'success')
    navigate(`/create/${quizId}`)
  }

  const deleteQuiz = async () => {
    if (!id) return
    if (!confirm('Delete this quiz permanently? This cannot be undone.')) return
    const { error } = await supabase.from('quizzes').delete().eq('id', id)
    if (error) { show('Could not delete quiz.', 'error'); return }
    show('Quiz deleted.', 'success')
    navigate('/quizzes')
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-text-primary mb-1">{isEdit ? 'Edit quiz' : 'Create a quiz'}</h1>
          <p className="text-text-muted">Build your questions, then save a draft or publish it.</p>
        </div>
        {isEdit && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${published ? 'text-success bg-success/10 border-success/30' : 'text-accent-amber bg-accent-amber/10 border-accent-amber/30'}`}>
            {published ? 'Published' : 'Draft'}
          </span>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Solar System Basics"
            className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3.5 py-2.5 text-sm outline-none focus:border-accent-violet/60" />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted mb-1.5 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What's this quiz about?"
            className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3.5 py-2.5 text-sm outline-none focus:border-accent-violet/60 resize-none" />
        </div>
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3 py-2.5 text-sm outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3 py-2.5 text-sm outline-none">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Time limit (s)</label>
            <input type="number" min={5} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3 py-2.5 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Questions per attempt</label>
            <input
              type="number"
              min={1}
              max={questions.length}
              value={questionsPerAttempt}
              onChange={(e) => setQuestionsPerAttempt(e.target.value)}
              placeholder={`All ${questions.length}`}
              className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">Visibility</label>
            <select value={isPublic ? 'public' : 'private'} onChange={(e) => setIsPublic(e.target.value === 'public')} className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3 py-2.5 text-sm outline-none">
              <option value="public">Public</option><option value="private">Private</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-text-faint -mt-1">
          Questions are always shuffled per attempt. Set "questions per attempt" lower than your total question count to draw a random subset each time — leave it blank to ask every question, just reshuffled.
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-text-primary flex items-center gap-2"><ListChecks size={18} /> Questions ({questions.length})</h2>
        <button onClick={addQuestion} className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass-card text-sm font-medium hover:border-accent-violet/50">
          <Plus size={15} /> Add question
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {questions.map((q, i) => (
          <div key={q.localId} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-text-faint text-xs font-medium">
                <GripVertical size={14} /> Question {i + 1}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-md hover:bg-bg-elevated disabled:opacity-30"><ArrowUp size={14} /></button>
                <button onClick={() => move(i, 1)} disabled={i === questions.length - 1} className="p-1.5 rounded-md hover:bg-bg-elevated disabled:opacity-30"><ArrowDown size={14} /></button>
                <button onClick={() => removeQuestion(q.localId)} disabled={questions.length === 1} className="p-1.5 rounded-md hover:bg-danger/10 text-danger disabled:opacity-30"><Trash2 size={14} /></button>
              </div>
            </div>

            <textarea
              value={q.question_text}
              onChange={(e) => updateQuestion(q.localId, { question_text: e.target.value })}
              placeholder="Question text"
              rows={2}
              className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3.5 py-2.5 text-sm outline-none focus:border-accent-violet/60 resize-none mb-3"
            />

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(q.localId, { correct_answer: opt })}
                    className={`h-8 w-8 shrink-0 rounded-lg text-xs font-bold uppercase border ${q.correct_answer === opt ? 'bg-success/15 border-success text-success' : 'bg-bg-elevated border-bg-border text-text-faint'}`}
                    title="Mark as correct answer"
                  >
                    {opt}
                  </button>
                  <input
                    value={q[`option_${opt}` as const]}
                    onChange={(e) => updateQuestion(q.localId, { [`option_${opt}`]: e.target.value } as any)}
                    placeholder={`Option ${opt.toUpperCase()}`}
                    className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3 py-2 text-sm outline-none focus:border-accent-violet/60"
                  />
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <input
                value={q.explanation ?? ''}
                onChange={(e) => updateQuestion(q.localId, { explanation: e.target.value })}
                placeholder="Explanation (optional, shown as a hint and in results)"
                className="w-full rounded-xl bg-bg-elevated border border-bg-border px-3.5 py-2 text-sm outline-none focus:border-accent-violet/60"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Points</label>
                <input type="number" min={1} value={q.points} onChange={(e) => updateQuestion(q.localId, { points: Number(e.target.value) })} className="w-20 rounded-xl bg-bg-elevated border border-bg-border px-3 py-2 text-sm outline-none" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => save(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass-card text-sm font-semibold hover:border-accent-violet/50 disabled:opacity-50">
          <Save size={15} /> {saving ? 'Saving...' : 'Save draft'}
        </button>
        <button onClick={() => save(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-violet text-white text-sm font-semibold hover:bg-accent-violetDim disabled:opacity-50">
          <Send size={15} /> {saving ? 'Publishing...' : 'Publish quiz'}
        </button>
        {isEdit && published && (
          <button onClick={() => save(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass-card text-sm font-semibold text-accent-amber hover:border-accent-amber/50">
            <EyeOff size={15} /> Unpublish
          </button>
        )}
        {isEdit && (
          <button onClick={deleteQuiz} className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass-card text-sm font-semibold text-danger hover:border-danger/50 ml-auto">
            <Trash2 size={15} /> Delete quiz
          </button>
        )}
      </div>
    </div>
  )
}
