import { Link } from 'react-router-dom'
import { Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-28 text-center">
      <Ghost className="mx-auto text-accent-violet animate-floaty" size={56} />
      <h1 className="font-display text-3xl mt-6 mb-2">Page not found</h1>
      <p className="text-text-muted mb-8">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/" className="px-5 py-2.5 rounded-lg bg-accent-violet text-white font-semibold hover:bg-accent-violetDim">
        Back to home
      </Link>
    </div>
  )
}
