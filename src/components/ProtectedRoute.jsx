import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (userProfile?.banned === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8 bg-card border border-border rounded-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-500">Account Banned</h2>
          <p className="text-muted-foreground mb-6">
            Your account has been banned. You no longer have access to this platform.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            If you believe this is a mistake, please contact support.
          </p>
          <button
            onClick={() => {
              window.location.href = "/login"
            }}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (adminOnly && userProfile?.role !== "admin") {
    console.log("❌ Admin access denied - Current role:", userProfile?.role, "User:", currentUser?.email)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8 bg-card border border-border rounded-xl">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-yellow-500">Admin Access Required</h2>
          <p className="text-muted-foreground mb-4">
            You need admin privileges to access this page.
          </p>
          <div className="bg-muted p-3 rounded-lg mb-4 text-sm text-left">
            <p className="mb-1"><strong>Email:</strong> {currentUser?.email}</p>
            <p><strong>Current Role:</strong> {userProfile?.role || 'user'}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            If you believe you should have admin access, please check your database role field or contact support.
          </p>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return children
}
