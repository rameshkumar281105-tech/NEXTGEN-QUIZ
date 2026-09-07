import { Navigate, useLocation } from 'react-router-dom'
import { ReactNode, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { Role } from '../types'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode
  roles?: Role[]
}) {
  const { user, profile, loading } = useAuth()
  const { show } = useToast()
  const location = useLocation()

  const deniedByRole = Boolean(roles && profile && !roles.includes(profile.role))

  useEffect(() => {
    if (deniedByRole) {
      show(`This page needs a ${roles!.join(' or ')} account. You're signed in as ${profile?.role}.`, 'error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deniedByRole])

  if (loading) return <LoadingSpinner full label="Checking your session..." />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (deniedByRole) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
