import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { JobStatus } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await db.job.findUnique({
      where: { id: params.id },
      include: {
        recruiter: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        customQuestions: {
          orderBy: {
            order: "asc"
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Transform job for frontend
    const transformedJob = {
      ...job,
      locations: job.locations ? JSON.parse(job.locations) : [],
      skills: job.skills ? JSON.parse(job.skills) : [],
      applicationCount: job._count.applications
    }

    return NextResponse.json(transformedJob)
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    // Check if job exists and user has permission to edit it
    const existingJob = await db.job.findUnique({
      where: { id: params.id },
      include: {
        recruiter: {
          include: {
            user: true
          }
        }
      }
    })

    if (!existingJob) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Check if user is the recruiter who posted the job or an admin
    const hasPermission = session.user.role === "ADMIN" || 
                         session.user.role === "SUPER_ADMIN" ||
                         existingJob.recruiter.userId === session.user.id

    if (!hasPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const updatedJob = await db.job.update({
      where: { id: params.id },
      data: {
        title: data.title,
        companyName: data.companyName,
        description: data.description,
        shortDescription: data.shortDescription,
        locations: data.locations,
        skills: data.skills,
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        employmentType: data.employmentType,
        noticePeriod: data.noticePeriod,
        workMode: data.workMode,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status
      }
    })

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error("Error updating job:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Check if job exists and user has permission to delete it
    const existingJob = await db.job.findUnique({
      where: { id: params.id },
      include: {
        recruiter: {
          include: {
            user: true
          }
        }
      }
    })

    if (!existingJob) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Check if user is the recruiter who posted the job or an admin
    const hasPermission = session.user.role === "ADMIN" || 
                         session.user.role === "SUPER_ADMIN" ||
                         existingJob.recruiter.userId === session.user.id

    if (!hasPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await db.job.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Job deleted successfully" })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}