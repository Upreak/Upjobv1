import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/types/enums"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get counts from database
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalJobs,
      totalApplications,
      activeWorkspaces
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: UserRole.CANDIDATE } }),
      db.user.count({ where: { role: UserRole.RECRUITER } }),
      db.job.count({ where: { status: "ACTIVE" } }),
      db.application.count(),
      db.workspace.count()
    ])

    const stats = {
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalJobs,
      totalApplications,
      activeWorkspaces
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

