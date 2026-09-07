import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Rocket, KeyRound, PenSquare, Trophy, Sparkles, Users, Timer, BarChart3,
  Atom, Cpu, Landmark, Trophy as SportsIcon, Newspaper, Globe2, ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playRandomQuiz } from '../lib/randomQuiz'

const categories = [
  { name: 'General Knowledge', icon: Globe2, color: 'from-accent-violet to-accent-cyan' },
  { name: 'Science', icon: Atom, color: 'from-accent-cyan to-success' },
  { name: 'Technology', icon: Cpu, color: 'from-accent-violet to-accent-amber' },
  { name: 'History', icon: Landmark, color: 'from-accent-amber to-danger' },
  { name: 'Sports', icon: SportsIcon, color: 'from-success to-accent-cyan' },
  { name: 'Current Affairs', icon: Newspaper, color: 'from-danger to-accent-violet' },
]

const features = [
  { icon: Timer, title: 'Live & solo modes', text: 'Play at your own pace or host a realtime game with a shareable PIN.' },
  { icon: BarChart3, title: 'Instant scoring', text: 'Every attempt is scored automatically, with a full question-by-question review.' },
  { icon: Sparkles, title: 'XP & achievements', text: 'Earn XP, level up, keep streaks alive and unlock badges as you play.' },
  { icon: Users, title: 'Built for classrooms', text: 'Professors create and manage quizzes; admins oversee the whole platform.' },
]

const steps = [
  { title: 'Pick or create a quiz', text: 'Browse public quizzes by category and difficulty, or build your own in minutes.' },
  { title: 'Play solo or host live', text: 'Jump straight in, or generate a 6-digit PIN so others can join your game.' },
  { title: 'Track your progress', text: 'See your score, XP and rank instantly, and climb the leaderboard.' },
]

export default function Home() {
  const { user } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.trim().length !== 6) return
    navigate(`/join/${pin.trim()}`)
  }

  const handleStartQuiz = () => {
    if (!user) { navigate('/signup'); return }
    playRandomQuiz(navigate, show)
  }

  return (
    <div>
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 rounded-full px-3 py-1">
            <Sparkles size={13} /> Realtime quizzing, reimagined
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] mt-5 text-text-primary">
            Quizzes that feel like <span className="text-gradient">a live game</span>, not a form.
          </h1>
          <p className="text-text-muted text-lg mt-5 max-w-lg">
            NextGen Quiz brings students, professors and admins together — build quizzes,
            challenge a room full of players in realtime, and climb the leaderboard along the way.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={handleStartQuiz} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim transition-colors">
              <Rocket size={18} /> Start a random quiz
            </button>
            <Link to="/quizzes" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass-card font-semibold text-text-primary hover:border-accent-violet/50">
              <Sparkles size={18} /> Browse quizzes
            </Link>
            <Link to="/create" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass-card font-semibold text-text-primary hover:border-accent-violet/50">
              <PenSquare size={18} /> Create a quiz
            </Link>
          </div>

          <form onSubmit={handleJoin} className="mt-6 flex items-center gap-2 max-w-sm">
            <div className="flex items-center gap-2 glass-card rounded-xl px-3 flex-1">
              <KeyRound size={16} className="text-text-faint" />
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit game PIN"
                className="bg-transparent py-3 text-sm w-full outline-none placeholder:text-text-faint"
                inputMode="numeric"
              />
            </div>
            <button className="px-4 py-3 rounded-xl bg-bg-elevated border border-bg-border text-sm font-semibold hover:border-accent-violet/50">
              Join
            </button>
          </form>
        </div>

        <div className="relative">
          <div className="glass-card rounded-3xl p-6 animate-floaty">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-accent-amber bg-accent-amber/10 px-2.5 py-1 rounded-full">Question 3/10</span>
              <span className="flex items-center gap-1 text-xs text-text-muted"><Timer size={13}/> 00:12</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-border mb-6 overflow-hidden">
              <div className="h-full w-[30%] bg-gradient-to-r from-accent-violet to-accent-cyan" />
            </div>
            <p className="font-display text-lg text-text-primary mb-5">Which planet has the most moons in our solar system?</p>
            <div className="grid grid-cols-2 gap-3">
              {['Jupiter', 'Saturn', 'Neptune', 'Mars'].map((opt, i) => (
                <div key={opt} className={`rounded-xl px-4 py-3 text-sm font-medium border ${i === 1 ? 'bg-success/10 border-success/40 text-success' : 'bg-bg-elevated border-bg-border text-text-muted'}`}>
                  {opt}
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl px-4 py-3 hidden sm:flex items-center gap-2 animate-popIn">
            <Trophy size={16} className="text-accent-amber" />
            <span className="text-xs font-semibold">+120 XP · Fast answer bonus</span>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl text-text-primary mb-8">Explore by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={`/quizzes?category=${encodeURIComponent(c.name)}`}
              className="glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-accent-violet/50 transition-colors"
            >
              <span className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center text-bg`}>
                <c.icon size={18} />
              </span>
              <span className="text-sm font-medium text-text-primary">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl text-text-primary mb-8">Everything you need to run a quiz</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <span className="h-10 w-10 rounded-xl bg-accent-violet/15 text-accent-violet grid place-items-center mb-4">
                <f.icon size={18} />
              </span>
              <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl text-text-primary mb-8">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative glass-card rounded-2xl p-6">
              <span className="font-display text-3xl text-accent-violet/40">{i + 1}</span>
              <h3 className="font-semibold text-text-primary mt-2 mb-1.5">{s.title}</h3>
              <p className="text-sm text-text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass-card rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">
          <h2 className="font-display text-3xl text-text-primary mb-3">Ready to test your knowledge?</h2>
          <p className="text-text-muted mb-8 max-w-md mx-auto">Join thousands of players competing on quizzes across six categories.</p>
          <Link to={user ? '/quizzes' : '/signup'} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-violet text-white font-semibold hover:bg-accent-violetDim">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
