import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/types/enums"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!recruiter) {
      return NextResponse.json({ message: "Recruiter profile not found" }, { status: 404 })
    }

    // Get job statistics
    const jobs = await db.job.findMany({
      where: { recruiterId: recruiter.id }
    })

    const totalJobs = jobs.length
    const activeJobs = jobs.filter(job => job.status === "ACTIVE").length

    // Get application statistics
    const applications = await db.application.findMany({
      where: {
        job: {
          recruiterId: recruiter.id
        }
      }
    })

    const totalApplications = applications.length
    
    // Get new applications in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const newApplications = applications.filter(
      app => new Date(app.createdAt) >= sevenDaysAgo
    ).length

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications,
      newApplications
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching recruiter stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}