import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // If user is not authenticated, redirect to signin
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Role-based route protection
    const userRole = token.role

    // Admin routes - only accessible by ADMIN and SUPER_ADMIN
    if (path.startsWith("/admin") && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Recruiter routes - only accessible by RECRUITER, ADMIN, and SUPER_ADMIN
    if (path.startsWith("/recruiter") && !["RECRUITER", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Candidate routes - only accessible by CANDIDATE, ADMIN, and SUPER_ADMIN
    if (path.startsWith("/candidate") && !["CANDIDATE", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/recruiter/:path*", 
    "/candidate/:path*",
    "/jobs/:path*",
    "/chat/:path*",
  ],
}

