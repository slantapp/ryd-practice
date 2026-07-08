import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuth } from './context/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { OtpVerificationPage } from './pages/OtpVerificationPage'
import { PracticeCatalogPage } from './pages/PracticeCatalogPage'
import { PracticeAttemptsPage } from './pages/PracticeAttemptsPage'
import { PracticeHomePage } from './pages/PracticeHomePage'
import { PracticeResultPage } from './pages/PracticeResultPage'
import { PracticeTakePage } from './pages/PracticeTakePage'
import { AssignedPracticePage } from './pages/AssignedPracticePage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { StudyPlannerPage } from './pages/StudyPlannerPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ResetSuccessPage } from './pages/ResetSuccessPage'
import { SignupPage } from './pages/SignupPage'
import { AuthRedirectPage } from './pages/AuthRedirectPage'
import { getAssignedPracticeId, isAllowedAssignedRoute } from './lib/assignedPracticeFlow'
import { PracticeSubscriptionGate } from './components/PracticeSubscriptionModal'

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, requiresProfileCompletion, bootstrapping } = useAuth()
  const location = useLocation()
  const assignedPracticeFlow =
    location.pathname.startsWith('/practice/assigned/') ||
    /^\/practice\/[^/]+\/take/.test(location.pathname) ||
    location.pathname.startsWith('/practice/result/')
  if (bootstrapping) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#12001f] text-white/70">
        <p className="text-sm">Loading your session...</p>
      </main>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  const assignedPracticeId = getAssignedPracticeId()
  if (assignedPracticeId && !isAllowedAssignedRoute(location.pathname)) {
    return <Navigate to={`/practice/assigned/${assignedPracticeId}`} replace />
  }
  if (
    requiresProfileCompletion &&
    !assignedPracticeFlow &&
    location.pathname !== '/profile-setup' &&
    location.pathname !== '/dashboard' &&
    !location.pathname.startsWith('/settings')
  ) {
    return <Navigate to="/dashboard" replace />
  }
  return (
    <PracticeSubscriptionGate>
      {children}
    </PracticeSubscriptionGate>
  )
}

function GuestRoute({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  const assignedPracticeId = getAssignedPracticeId()
  if (user) {
    if (assignedPracticeId) {
      return <Navigate to={`/practice/assigned/${assignedPracticeId}`} replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/signup" replace />}
      />
      <Route
        path="/signup"
        element={(
          <GuestRoute>
            <SignupPage />
          </GuestRoute>
        )}
      />
      <Route
        path="/otp"
        element={(
          <GuestRoute>
            <OtpVerificationPage />
          </GuestRoute>
        )}
      />
      <Route
        path="/login"
        element={(
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        )}
      />
      <Route path="/auth/redirect" element={<AuthRedirectPage />} />
      <Route
        path="/forgot-password"
        element={(
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        )}
      />
      <Route
        path="/reset-password"
        element={(
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        )}
      />
      <Route
        path="/reset-password/success"
        element={(
          <GuestRoute>
            <ResetSuccessPage />
          </GuestRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/profile-setup"
        element={(
          <ProtectedRoute>
            <ProfileSetupPage />
          </ProtectedRoute>
        )}
      />
      <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
      <Route
        path="/settings/profile"
        element={(
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/settings/password"
        element={(
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/study-planner"
        element={(
          <ProtectedRoute>
            <StudyPlannerPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/notifications"
        element={(
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/practice/home"
        element={(
          <ProtectedRoute>
            <PracticeHomePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/practice/catalog"
        element={(
          <ProtectedRoute>
            <PracticeCatalogPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/practice/attempts"
        element={(
          <ProtectedRoute>
            <PracticeAttemptsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/practice/assigned/:practiceId"
        element={(
          <ProtectedRoute>
            <AssignedPracticePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/practice/:practiceId/take"
        element={(
          <ProtectedRoute>
            <PracticeTakePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/practice/result/:attemptId"
        element={(
          <ProtectedRoute>
            <PracticeResultPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default App
