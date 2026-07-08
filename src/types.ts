export interface ApiResponse<T = unknown> {
  status: boolean
  message: string
  data: T
}

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  username: string
  email?: string | null
  phone?: string | null
  institutionId: string
  institution?: {
    id: string
    name: string
    uniqueSlug?: string | null
  }
}

export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignUpPayload {
  email: string
  password: string
}

export interface ProfileExtras {
  state: string
  timezone: string
  country: string
}

export interface PackagePracticeAccess {
  signupSource: string
  assignedPracticeId: string
  rydChildId?: number | null
  rydProgramId?: number | null
  rydPackageId?: number | null
}

export interface StudyPlannerData {
  weeklyGoalHours: number
  sessions: StudySession[]
  updatedAt: string
}

export interface StudySession {
  id: string
  title: string
  subject: string
  dayOfWeek: number
  startTime: string
  durationMins: number
  notes: string
  status: 'scheduled' | 'completed' | 'skipped'
}

export interface PracticeLeaderboardEntry {
  rank: number
  studentId: string
  displayName: string
  state: string | null
  averageScore: number
  bestScore: number
  completedSessions: number
  isCurrentUser: boolean
}

export interface PracticeLeaderboardResponse {
  entries: PracticeLeaderboardEntry[]
  currentUser: (PracticeLeaderboardEntry & { rank: number }) | null
  totalRanked: number
}

export interface PracticeItem {
  id: string
  name: string
  subjectName: string
  classLabel: string
  _count?: { questions: number }
}

export interface PracticeQuestion {
  id: string
  questionText: string
  questionType: 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer'
  options?: Record<string, string> | string | null
  correctAnswer?: string | null
  answerRationale?: string | null
  topicTag?: string | null
  order?: number
}

export interface PracticeAttemptSummary {
  total: number
  correct: number
  wrong: number
  score: number
}

export interface PracticeAttemptListItem {
  id: string
  practiceId: string
  practice: PracticeItem
  startedAt: string
  submittedAt: string | null
  totalQuestions: number
  answeredCount: number
  score: number | null
}

export interface PracticeAttemptDetail {
  id: string
  submittedAt: string | null
  practice: PracticeItem
  answers: Array<{
    questionId: string
    selectedAnswer: string
    isCorrect: boolean | null
    isFlagged: boolean
    question: PracticeQuestion
  }>
  summary: PracticeAttemptSummary
}

export interface AppNotification {
  id: string
  userId: string
  userType: string
  type: string
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}
