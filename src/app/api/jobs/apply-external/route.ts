import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== UserRole.JOBSEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { jobId, sourceUrl } = await request.json()

    if (!jobId || !sourceUrl) {
      return NextResponse.json({ error: "Job ID and source URL are required" }, { status: 400 })
    }

    // Get candidate profile
    const candidate = await db.candidate.findUnique({
      where: { userId: user.id }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 })
    }

    // Create external application record
    const application = await db.application.create({
      data: {
        projectId: jobId,
        candidateId: candidate.id,
        userId: user.id,
        status: "APPLIED",
        answers: JSON.stringify({
          sourceUrl,
          appliedAt: new Date().toISOString(),
          type: "EXTERNAL"
        })
      }
    })

    return NextResponse.json({
      message: "External application tracked successfully",
      application
    })
  } catch (error) {
    console.error("Error tracking external application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}