import { apiClient, readApiError } from './apiClient'
import type { AuthUser, LoginPayload, ProfileExtras, PackagePracticeAccess, SignUpPayload, StudyPlannerData, AppNotification } from '../types'

export const PRACTICE_SIGNUP_SOURCE = 'practice'

export const authApi = {
  signUp: async (payload: SignUpPayload) => {
    try {
      const response = await apiClient.post<{ message: string; token: string; student: AuthUser }>(
        '/auth/practice/register',
        payload,
      )
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to create account'))
    }
  },
  requestSignupOtp: async (email: string) => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/practice/signup/request-otp', { email })
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to send OTP'))
    }
  },
  verifySignupOtp: async (payload: SignUpPayload & { otp: string }) => {
    try {
      const response = await apiClient.post<{ message: string; token: string; student: AuthUser }>(
        '/auth/practice/signup/verify-otp',
        payload,
      )
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to verify OTP'))
    }
  },
  signIn: async (payload: LoginPayload) => {
    try {
      const response = await apiClient.post<{ message: string; token: string; student: AuthUser }>(
        '/auth/practice/login',
        payload,
      )
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to sign in'))
    }
  },
  requestPasswordReset: async (email: string) => {
    try {
      const response = await apiClient.post<{ message: string; status?: boolean }>(
        '/auth/practice/password/reset',
        { email },
      )
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to reset password'))
    }
  },
  verifyPasswordOtpAndReset: async (payload: { email: string; otp: string; newPassword: string }) => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/practice/password/verify-otp', payload)
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to reset password'))
    }
  },
  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await apiClient.put<{ message: string }>('/auth/practice/password', payload)
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to change password'))
    }
  },
  getMe: async () => {
    try {
      const response = await apiClient.get<{
        student: AuthUser
        profileExtras: ProfileExtras | null
        studyPlanner: StudyPlannerData | null
        packageAccess: PackagePracticeAccess | null
      }>('/auth/practice/me')
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Unable to load account'))
    }
  },
}

export const studentApi = {
  updateProfile: async (payload: {
    firstName: string
    lastName: string
    phone: string
    state: string
    timezone: string
    country: string
  }) => {
    try {
      const response = await apiClient.put<{
        message: string
        student: AuthUser
        profileExtras: ProfileExtras
      }>('/auth/practice/profile', payload)
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to update profile'))
    }
  },
}

export const studyPlannerApi = {
  get: async () => {
    try {
      const response = await apiClient.get<StudyPlannerData>('/auth/practice/study-planner')
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to load study planner'))
    }
  },
  save: async (data: StudyPlannerData) => {
    try {
      const response = await apiClient.put<{ message: string; studyPlanner: StudyPlannerData }>(
        '/auth/practice/study-planner',
        data,
      )
      return response.data.studyPlanner
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to save study planner'))
    }
  },
}

export const platformApi = {
  getStats: async () => {
    try {
      const response = await apiClient.get<{ practiceSets: number; totalQuestions: number }>('/public/practice-stats')
      return response.data
    } catch {
      return { practiceSets: 0, totalQuestions: 0 }
    }
  },
}

export const notificationApi = {
  getAll: async (params?: { isRead?: boolean; limit?: number }) => {
    try {
      const response = await apiClient.get<AppNotification[]>('/notifications', { params })
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to load notifications'))
    }
  },
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count')
      return response.data.count
    } catch {
      return 0
    }
  },
  markAsRead: async (id: string) => {
    try {
      const response = await apiClient.post<AppNotification>(`/notifications/${id}/read`)
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to mark notification as read'))
    }
  },
  markAllAsRead: async () => {
    try {
      const response = await apiClient.post<{ message: string; count: number }>('/notifications/mark-all-read')
      return response.data
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to mark all as read'))
    }
  },
  delete: async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`)
    } catch (error) {
      throw new Error(readApiError(error, 'Failed to delete notification'))
    }
  },
}
