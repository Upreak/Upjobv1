import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, ApplicationStatus } from "@/types/enums"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const whereClause: any = {
      candidateId: candidate.id
    }

    if (status && status !== "all") {
      whereClause.status = status
    }

    const [applications, totalCount] = await Promise.all([
      db.application.findMany({
        where: whereClause,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              companyName: true,
              status: true,
              locations: true,
              employmentType: true,
              workMode: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: offset,
        take: limit
      }),
      db.application.count({
        where: whereClause
      })
    ])

    const transformedApplications = applications.map(app => ({
      ...app,
      job: {
        ...app.job,
        locations: app.job.locations ? JSON.parse(app.job.locations) : []
      },
      answers: app.answers ? JSON.parse(app.answers) : {},
      candidateInfo: app.candidateInfo ? JSON.parse(app.candidateInfo) : {}
    }))

    return NextResponse.json({
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
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
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json({ message: "Candidate profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const jobId = formData.get("jobId") as string
    const coverLetter = formData.get("coverLetter") as string
    const answers = formData.get("answers") as string
    const resumeFile = formData.get("resume") as File | null

    if (!jobId) {
      return NextResponse.json({ message: "Job ID is required" }, { status: 400 })
    }

    // Check if job exists and is active
    const job = await db.job.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json({ message: "Job is not accepting applications" }, { status: 400 })
    }

    // Check if already applied
    const existingApplication = await db.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId: candidate.id
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json({ message: "You have already applied to this job" }, { status: 400 })
    }

    // Handle file upload
    let resumePath = candidate.resumePath // Use existing resume if no new file uploaded
    if (resumeFile) {
      const uploadsDir = path.join(process.cwd(), "uploads", "resumes")
      fs.mkdirSync(uploadsDir, { recursive: true })
      
      const fileExtension = path.extname(resumeFile.name)
      const fileName = `${uuidv4()}${fileExtension}`
      resumePath = path.join("uploads", "resumes", fileName)
      
      const bytes = await resumeFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      await writeFile(path.join(process.cwd(), resumePath), buffer)
    }

    // Create candidate info snapshot
    const candidateInfo = {
      fullName: candidate.fullName,
      email: candidate.user.email,
      phone: candidate.phone,
      currentRole: candidate.currentRole,
      totalExperience: candidate.totalExperience,
      currentCTC: candidate.currentCTC,
      expectedCTC: candidate.expectedCTC,
      skills: candidate.skills ? JSON.parse(candidate.skills) : [],
      preferredLocations: candidate.preferredLocations ? JSON.parse(candidate.preferredLocations) : [],
      profileCompleteness: candidate.profileCompleteness
    }

    // Create application
    const application = await db.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        coverLetter: coverLetter || null,
        resumePath,
        answers: answers || null,
        status: ApplicationStatus.APPLIED,
        candidateInfo: JSON.stringify(candidateInfo)
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}