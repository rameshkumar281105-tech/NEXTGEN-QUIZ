import { useEffect, useState } from 'react'
import {
  Users, ListChecks, BarChart3, ShieldAlert, Trash2, Ban, CheckCircle2, EyeOff, Eye,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Profile, Quiz, Role } from '../types'

type Tab = 'overview' | 'users' | 'quizzes'

export default function Admin() {
  const { show } = useToast()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Profile[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [stats, setStats] = useState({ users: 0, quizzes: 0, attempts: 0, avgScore: 0 })

  const loadAll = async () => {
    setLoading(true)
    const [{ data: u }, { data: q }, { count: userCount }, { count: quizCount }, { data: attempts }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('quizzes').select('*, questions(count), profiles!quizzes_creator_id_fkey(name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('quizzes').select('*', { count: 'exact', head: true }),
      supabase.from('quiz_attempts').select('percentage'),
    ])
    setUsers((u ?? []) as Profile[])
    setQuizzes((q ?? []).map((qz: any) => ({ ...qz, question_count: qz.questions?.[0]?.count ?? 0, creator_name: qz.profiles?.name })))
    const avg = attempts?.length ? Math.round(attempts.reduce((s, a: any) => s + a.percentage, 0) / attempts.length) : 0
    setStats({ users: userCount ?? 0, quizzes: quizCount ?? 0, attempts: attempts?.length ?? 0, avgScore: avg })
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const toggleBlock = async (u: Profile) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !u.is_blocked }).eq('id', u.id)
    if (error) return show('Could not update user.', 'error')
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x)))
    show(u.is_blocked ? 'User unblocked.' : 'User blocked.', 'success')
  }

  const changeRole = async (u: Profile, role: Role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', u.id)
    if (error) return show('Could not update role.', 'error')
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)))
    show('Role updated.', 'success')
  }

  const deleteUser = async (u: Profile) => {
    if (!confirm(`Remove ${u.name}'s profile? Their auth account must be removed separately from Supabase.`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', u.id)
    if (error) return show('Could not delete user.', 'error')
    setUsers((list) => list.filter((x) => x.id !== u.id))
    show('User profile removed.', 'success')
  }

  const togglePublish = async (q: Quiz) => {
    const { error } = await supabase.from('quizzes').update({ published: !q.published }).eq('id', q.id)
    if (error) return show('Could not update quiz.', 'error')
    setQuizzes((list) => list.map((x) => (x.id === q.id ? { ...x, published: !x.published } : x)))
    show(q.published ? 'Quiz unpublished.' : 'Quiz published.', 'success')
  }

  const deleteQuiz = async (q: Quiz) => {
    if (!confirm(`Delete "${q.title}" permanently?`)) return
    const { error } = await supabase.from('quizzes').delete().eq('id', q.id)
    if (error) return show('Could not delete quiz.', 'error')
    setQuizzes((list) => list.filter((x) => x.id !== q.id))
    show('Quiz deleted.', 'success')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-text-primary mb-1 flex items-center gap-2"><ShieldAlert className="text-accent-violet" /> Admin panel</h1>
      <p className="text-text-muted mb-8">Manage users, quizzes and view platform-wide reports.</p>

      <div className="inline-flex glass-card rounded-xl p-1 mb-8">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={BarChart3} label="Overview" />
        <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={Users} label="Users" />
        <TabButton active={tab === 'quizzes'} onClick={() => setTab('quizzes')} icon={ListChecks} label="Quizzes" />
      </div>

      {loading ? <LoadingSpinner full /> : (
        <>
          {tab === 'overview' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total users" value={stats.users} />
              <StatCard label="Total quizzes" value={stats.quizzes} />
              <StatCard label="Total attempts" value={stats.attempts} />
              <StatCard label="Average score" value={`${stats.avgScore}%`} />
            </div>
          )}

          {tab === 'users' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              {users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm border-b border-bg-border last:border-0">
                  <span className="h-8 w-8 rounded-full bg-bg-elevated grid place-items-center text-xs font-bold text-text-muted shrink-0">{u.name[0]?.toUpperCase()}</span>
                  <div className="min-w-[140px]">
                    <p className="font-medium text-text-primary">{u.name}</p>
                    <p className="text-xs text-text-muted">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as Role)}
                    className="rounded-lg bg-bg-elevated border border-bg-border px-2 py-1.5 text-xs"
                  >
                    <option value="student">Student</option>
                    <option value="professor">Professor</option>
                    <option value="admin">Admin</option>
                  </select>
                  {u.is_blocked && <span className="text-xs text-danger">Blocked</span>}
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => toggleBlock(u)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg glass-card text-xs hover:border-accent-violet/50">
                      {u.is_blocked ? <CheckCircle2 size={13} /> : <Ban size={13} />} {u.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button onClick={() => deleteUser(u)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'quizzes' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              {quizzes.map((q) => (
                <div key={q.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm border-b border-bg-border last:border-0">
                  <div className="min-w-[160px]">
                    <p className="font-medium text-text-primary">{q.title}</p>
                    <p className="text-xs text-text-muted">{q.category} · by {q.creator_name} · {q.question_count} questions</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${q.published ? 'text-success bg-success/10' : 'text-accent-amber bg-accent-amber/10'}`}>
                    {q.published ? 'Published' : 'Draft'}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => togglePublish(q)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg glass-card text-xs hover:border-accent-violet/50">
                      {q.published ? <EyeOff size={13} /> : <Eye size={13} />} {q.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => deleteQuiz(q)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${active ? 'bg-accent-violet text-white' : 'text-text-muted'}`}>
      <Icon size={14} /> {label}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="font-display text-2xl text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}
