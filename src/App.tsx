import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Quizzes from './pages/Quizzes'
import QuizPlay from './pages/QuizPlay'
import CreateQuiz from './pages/CreateQuiz'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Performance from './pages/Performance'
import JoinQuiz from './pages/JoinQuiz'
import Host from './pages/Host'
import Game from './pages/Game'
import Results from './pages/Results'
import Rewards from './pages/Rewards'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="app-backdrop" />
      <div className="grid-overlay" />
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quiz/:id" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>} />
        <Route path="/create/:id" element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
        <Route path="/join/:pin" element={<ProtectedRoute><JoinQuiz /></ProtectedRoute>} />
        <Route path="/host" element={<ProtectedRoute><Host /></ProtectedRoute>} />
        <Route path="/game/:id" element={<ProtectedRoute><Game /></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
