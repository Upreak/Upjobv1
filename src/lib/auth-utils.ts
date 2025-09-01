import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }
  return user
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth()
  if (user.role !== role) {
    redirect("/unauthorized")
  }
  return user
}

export async function requireAnyRole(roles: UserRole[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    redirect("/unauthorized")
  }
  return user
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (requiredRole === UserRole.SUPER_ADMIN) {
    return userRole === UserRole.SUPER_ADMIN
  }
  if (requiredRole === UserRole.ADMIN) {
    return userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN
  }
  if (requiredRole === UserRole.RECRUITER) {
    return userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN || userRole === UserRole.RECRUITER
  }
  return true // JOBSEEKER can access anything
}