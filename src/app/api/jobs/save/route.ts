import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.JOBSEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Check if candidate profile exists
    let candidate = await db.candidate.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (!candidate) {
      // Create candidate profile if it doesn't exist
      candidate = await db.candidate.create({
        data: {
          userId: session.user.id
        }
      })
    }

    // Check if job is already saved
    const existingSavedJob = await db.savedJob.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: jobId
        }
      }
    })

    if (existingSavedJob) {
      return NextResponse.json({ 
        error: "Job already saved",
        savedJobId: existingSavedJob.id 
      }, { status: 400 })
    }

    // Save the job
    const savedJob = await db.savedJob.create({
      data: {
        candidateId: candidate.id,
        jobId: jobId
      }
    })

    return NextResponse.json({
      message: "Job saved successfully",
      savedJobId: savedJob.id
    })
  } catch (error) {
    console.error("Error saving job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.JOBSEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const candidate = await db.candidate.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (!candidate) {
      return NextResponse.json({ savedJobs: [] })
    }

    const savedJobs = await db.savedJob.findMany({
      where: {
        candidateId: candidate.id
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            company: true,
            description: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      savedJobs: savedJobs.map(savedJob => ({
        id: savedJob.id,
        projectId: savedJob.projectId,
        project: savedJob.project,
        savedAt: savedJob.createdAt
      }))
    }
  } catch (error) {
    console.error("Error fetching saved jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}