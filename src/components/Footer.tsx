import { Link } from 'react-router-dom'
import { Brain } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-bg-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display font-semibold text-text-primary mb-2">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan text-bg">
              <Brain size={14} />
            </span>
            NextGenQuiz
          </div>
          <p className="text-sm text-text-muted">Play, host and create quizzes — solo or live with friends.</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-3">Play</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link to="/quizzes" className="hover:text-text-primary">Browse quizzes</Link></li>
            <li><Link to="/join/000000" className="hover:text-text-primary">Join with PIN</Link></li>
            <li><Link to="/leaderboard" className="hover:text-text-primary">Leaderboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-3">Create</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link to="/create" className="hover:text-text-primary">Create a quiz</Link></li>
            <li><Link to="/host" className="hover:text-text-primary">Host a live game</Link></li>
            <li><Link to="/performance" className="hover:text-text-primary">My performance</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-3">Account</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link to="/login" className="hover:text-text-primary">Log in</Link></li>
            <li><Link to="/signup" className="hover:text-text-primary">Sign up</Link></li>
            <li><Link to="/rewards" className="hover:text-text-primary">Rewards</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bg-border py-5 text-center text-xs text-text-faint">
        © {new Date().getFullYear()} NextGenQuiz. Built for classrooms and game nights alike.
      </div>
    </footer>
  )
}
