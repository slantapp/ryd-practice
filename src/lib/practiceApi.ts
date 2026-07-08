import { apiClient, readApiError } from './apiClient'
import type {
  PracticeAttemptDetail,
  PracticeAttemptListItem,
  PracticeAttemptSummary,
  PracticeItem,
  PracticeLeaderboardEntry,
  PracticeLeaderboardResponse,
  PracticeQuestion,
} from '../types'

function normalizeQuestion(raw: Record<string, unknown>): PracticeQuestion {
  return {
    id: String(raw.id),
    questionText: String(raw.questionText || raw.question || ''),
    questionType: raw.questionType as PracticeQuestion['questionType'],
    options: (raw.options as PracticeQuestion['options']) ?? null,
    correctAnswer: raw.correctAnswer != null ? String(raw.correctAnswer) : null,
    answerRationale: raw.answerRationale != null ? String(raw.answerRationale) : null,
    topicTag: raw.topicTag != null ? String(raw.topicTag) : null,
    order: typeof raw.order === 'number' ? raw.order : undefined,
  }
}

function normalizePracticeList(data: unknown): PracticeItem[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { practices?: PracticeItem[] }).practices)) {
    return (data as { practices: PracticeItem[] }).practices
  }
  return []
}

export const practiceApi = {
  list: async (params?: { class?: string; subject?: string; tag?: string }) => {
    try {
      const response = await apiClient.get<PracticeItem[] | { practices: PracticeItem[] }>('/practices/student', {
        params,
      })
      return normalizePracticeList(response.data)
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to load practice list'))
    }
  },
  getAssignedStatus: async (practiceId: string) => {
    try {
      const response = await apiClient.get<{
        practice: PracticeItem
        inProgressAttemptId: string | null
        submittedAttemptId: string | null
        canStart: boolean
        canResume: boolean
        viewResultOnly: boolean
      }>(`/practices/student/${practiceId}/assigned-status`)
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to load assigned practice'))
    }
  },
  getPractice: async (practiceId: string) => {
    try {
      const response = await apiClient.get<PracticeItem>(`/practices/student/${practiceId}`)
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to load practice'))
    }
  },
  getQuestions: async (practiceId: string) => {
    try {
      const response = await apiClient.get<Record<string, unknown>[]>(`/practices/student/${practiceId}/questions`)
      return response.data.map(normalizeQuestion)
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to load questions'))
    }
  },
  startAttempt: async (practiceId: string) => {
    try {
      const response = await apiClient.post<{ id: string }>(`/practices/student/${practiceId}/attempts`)
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to start attempt'))
    }
  },
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    payload: {
      selectedAnswer?: string
      isFlagged?: boolean
      showAnswer?: boolean
    },
  ) => {
    try {
      const response = await apiClient.put<{
        answer?: unknown
        correctAnswer?: string
        isCorrect?: boolean
        answerRationale?: string | null
        topicTag?: string | null
      }>(`/practices/student/attempts/${attemptId}/answer`, {
        questionId,
        ...payload,
      })
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to save answer'))
    }
  },
  submitAttempt: async (attemptId: string) => {
    try {
      const response = await apiClient.post<{ attempt: { id: string }; summary: PracticeAttemptSummary }>(
        `/practices/student/attempts/${attemptId}/submit`,
      )
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to submit practice'))
    }
  },
  getAttempt: async (attemptId: string) => {
    try {
      const response = await apiClient.get<PracticeAttemptDetail>(`/practices/student/attempts/${attemptId}`)
      return {
        ...response.data,
        answers: response.data.answers.map((a) => ({
          ...a,
          question: normalizeQuestion(a.question as unknown as Record<string, unknown>),
        })),
      }
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to load practice result'))
    }
  },
  listAttempts: async () => {
    try {
      const response = await apiClient.get<PracticeAttemptListItem[]>('/practices/student/my-attempts')
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to load attempt history'))
    }
  },
  getLeaderboard: async (limit = 20) => {
    try {
      const response = await apiClient.get<PracticeLeaderboardResponse>('/practices/student/leaderboard', {
        params: { limit },
      })
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to load leaderboard'))
    }
  },
}

export type { PracticeLeaderboardEntry }
