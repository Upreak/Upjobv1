import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidate = await db.candidate.findUnique({
      where: { userId: session.user.id }
    })

    if (!candidate) {
      return NextResponse.json({ message: "Candidate profile not found" }, { status: 404 })
    }

    const savedJobs = await db.savedJob.findMany({
      where: { candidateId: candidate.id },
      include: {
        job: {
          include: {
            _count: {
              select: {
                applications: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const transformedJobs = savedJobs.map(savedJob => ({
      ...savedJob.job,
      locations: savedJob.job.locations ? JSON.parse(savedJob.job.locations) : [],
      skills: savedJob.job.skills ? JSON.parse(savedJob.job.skills) : [],
      applicationCount: savedJob.job._count.applications,
      savedAt: savedJob.createdAt
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error("Error fetching saved jobs:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidate = await db.candidate.findUnique({
      where: { userId: session.user.id }
    })

    if (!candidate) {
      return NextResponse.json({ message: "Candidate profile not found" }, { status: 404 })
    }

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ message: "Job ID is required" }, { status: 400 })
    }

    // Check if job exists
    const job = await db.job.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Check if already saved
    const existingSavedJob = await db.savedJob.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId: candidate.id
        }
      }
    })

    if (existingSavedJob) {
      return NextResponse.json({ message: "Job already saved" }, { status: 400 })
    }

    const savedJob = await db.savedJob.create({
      data: {
        jobId,
        candidateId: candidate.id
      }
    })

    return NextResponse.json(savedJob, { status: 201 })
  } catch (error) {
    console.error("Error saving job:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidate = await db.candidate.findUnique({
      where: { userId: session.user.id }
    })

    if (!candidate) {
      return NextResponse.json({ message: "Candidate profile not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ message: "Job ID is required" }, { status: 400 })
    }

    const deletedJob = await db.savedJob.delete({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId: candidate.id
        }
      }
    })

    return NextResponse.json({ message: "Job removed from saved list" })
  } catch (error) {
    console.error("Error removing saved job:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}