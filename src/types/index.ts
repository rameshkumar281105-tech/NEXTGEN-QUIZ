export type Role = 'student' | 'professor' | 'admin'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameStatus = 'lobby' | 'active' | 'finished'

export interface Profile {
  id: string
  name: string
  email: string
  mobile: string | null
  address: string | null
  role: Role
  avatar: string | null
  xp: number
  level: number
  streak: number
  best_streak: number
  is_blocked: boolean
  created_at: string
}

export interface Quiz {
  id: string
  creator_id: string
  title: string
  description: string | null
  category: string
  difficulty: Difficulty
  time_limit: number
  is_public: boolean
  published: boolean
  questions_per_attempt: number | null
  created_at: string
  question_count?: number
  creator_name?: string
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'a' | 'b' | 'c' | 'd'
  explanation: string | null
  points: number
  question_order: number
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number
  percentage: number
  correct_answers: number
  wrong_answers: number
  unanswered: number
  time_taken: number
  xp_earned: number
  completed_at: string
  quiz_title?: string
}

export interface Answer {
  id: string
  attempt_id: string
  question_id: string
  selected_answer: string | null
  is_correct: boolean
  points: number
  response_time: number
}

export interface MultiplayerGame {
  id: string
  quiz_id: string
  host_id: string
  game_pin: string
  status: GameStatus
  current_question: number
  question_started_at: string | null
  created_at: string
}

export interface GamePlayer {
  id: string
  game_id: string
  user_id: string | null
  player_name: string
  score: number
  joined_at: string
}

export interface GameAnswer {
  id: string
  game_id: string
  player_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  points: number
  response_time: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: string
}

export const CATEGORIES = [
  'General Knowledge',
  'Science',
  'Technology',
  'History',
  'Sports',
  'Current Affairs',
] as const

export const LIFELINE_LIMITS = {
  fiftyFifty: 1,
  skip: 1,
  extraTime: 1,
  hint: 1,
} as const
