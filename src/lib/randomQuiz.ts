import { NavigateFunction } from 'react-router-dom'
import { supabase } from './supabase'

const LAST_QUIZ_KEY = 'nextgen-quiz:last-random-quiz'

/**
 * Picks a random published, public quiz and navigates to it.
 * Avoids repeating the immediately-previous random pick when other quizzes
 * are available. Shows a friendly toast if the catalog is empty instead of
 * doing nothing.
 */
export async function playRandomQuiz(navigate: NavigateFunction, show: (msg: string, kind?: 'success' | 'error' | 'info') => void) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id')
    .eq('is_public', true)
    .eq('published', true)

  if (error) {
    show('Could not load quizzes right now. Please try again.', 'error')
    return
  }

  if (!data || data.length === 0) {
    show('No quizzes are published yet — create one to get started!', 'info')
    navigate('/create')
    return
  }

  const lastId = sessionStorage.getItem(LAST_QUIZ_KEY)
  const pool = data.length > 1 ? data.filter((q) => q.id !== lastId) : data
  const pick = pool[Math.floor(Math.random() * pool.length)]

  sessionStorage.setItem(LAST_QUIZ_KEY, pick.id)
  navigate(`/quiz/${pick.id}`)
}
