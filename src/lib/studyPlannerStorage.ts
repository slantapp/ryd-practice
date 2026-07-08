import type { StudyPlannerData, StudySession } from '../types'

export type { StudySession, StudyPlannerData }
export type StudySessionStatus = StudySession['status']

const STORAGE_PREFIX = 'practice-study-planner:'

export function plannerKey(userId: string) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`
}

export function defaultPlannerData(): StudyPlannerData {
  return {
    weeklyGoalHours: 10,
    sessions: [],
    updatedAt: new Date().toISOString(),
  }
}

export function loadPlannerData(userId: string): StudyPlannerData {
  const raw = localStorage.getItem(plannerKey(userId))
  if (!raw) return defaultPlannerData()
  try {
    const parsed = JSON.parse(raw) as StudyPlannerData
    if (!parsed.sessions || !Array.isArray(parsed.sessions)) return defaultPlannerData()
    return parsed
  } catch {
    return defaultPlannerData()
  }
}

export function savePlannerDataLocal(userId: string, data: StudyPlannerData) {
  localStorage.setItem(
    plannerKey(userId),
    JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
  )
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export function totalScheduledMins(sessions: StudySession[]) {
  return sessions.reduce((sum, s) => sum + s.durationMins, 0)
}

export function completedMins(sessions: StudySession[]) {
  return sessions.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.durationMins, 0)
}

export function formatTime12(time24: string) {
  const [hRaw, mRaw] = time24.split(':')
  const h = Number(hRaw)
  const m = mRaw ?? '00'
  if (Number.isNaN(h)) return time24
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${m} ${period}`
}

export function sessionEndTime(startTime: string, durationMins: number) {
  const [hRaw, mRaw] = startTime.split(':')
  const total = Number(hRaw) * 60 + Number(mRaw) + durationMins
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return formatTime12(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
}

export const SUBJECT_STYLES: Record<string, { chip: string; bar: string }> = {
  Mathematics: { chip: 'planner-chip planner-chip-math', bar: 'planner-bar-math' },
  English: { chip: 'planner-chip planner-chip-english', bar: 'planner-bar-english' },
  'Basic Science': { chip: 'planner-chip planner-chip-science', bar: 'planner-bar-science' },
  'Civic Education': { chip: 'planner-chip planner-chip-civic', bar: 'planner-bar-civic' },
  Mixed: { chip: 'planner-chip planner-chip-mixed', bar: 'planner-bar-mixed' },
  Other: { chip: 'planner-chip planner-chip-other', bar: 'planner-bar-other' },
}

export function subjectStyle(subject: string) {
  return SUBJECT_STYLES[subject] ?? SUBJECT_STYLES.Other
}
