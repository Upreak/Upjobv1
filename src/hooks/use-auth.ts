import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  }
}

export function useRole() {
  const { user } = useAuth()
  return user?.role
}

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return { isLoading: true, isAuthorized: false }
  }

  if (!isAuthenticated) {
    return { isLoading: false, isAuthorized: false, reason: "unauthenticated" }
  }

  if (requiredRole && user?.role !== requiredRole) {
    return { isLoading: false, isAuthorized: false, reason: "unauthorized" }
  }

  return { isLoading: false, isAuthorized: true, user }
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.SUPER_ADMIN]: 4,
    [UserRole.ADMIN]: 3,
    [UserRole.RECRUITER]: 2,
    [UserRole.CANDIDATE]: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}