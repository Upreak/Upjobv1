import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, JobStatus } from "@prisma/client"

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const whereClause: any = {
      recruiterId: recruiter.id
    }

    if (status && status !== "all") {
      whereClause.status = status
    }

    const [jobs, totalCount] = await Promise.all([
      db.job.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: offset,
        take: limit
      }),
      db.job.count({
        where: whereClause
      })
    ])

    const jobsWithCounts = jobs.map(job => ({
      ...job,
      applicationCount: job._count.applications,
      locations: job.locations ? JSON.parse(job.locations) : [],
      skills: job.skills ? JSON.parse(job.skills) : []
    }))

    return NextResponse.json({
      jobs: jobsWithCounts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            workspaceId: true
          }
        }
      }
    })

    if (!recruiter) {
      return NextResponse.json({ message: "Recruiter profile not found" }, { status: 404 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.companyName || !data.description) {
      return NextResponse.json({ 
        message: "Title, company name, and description are required" 
      }, { status: 400 })
    }

    const job = await db.job.create({
      data: {
        workspaceId: recruiter.user.workspaceId || "",
        recruiterId: recruiter.id,
        title: data.title,
        companyName: data.companyName,
        description: data.description,
        shortDescription: data.shortDescription || "",
        locations: data.locations,
        skills: data.skills,
        experienceMin: data.experienceMin || 0,
        experienceMax: data.experienceMax || null,
        salaryMin: data.salaryMin || null,
        salaryMax: data.salaryMax || null,
        currency: data.currency || "USD",
        employmentType: data.employmentType,
        noticePeriod: data.noticePeriod || "",
        workMode: data.workMode,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status || JobStatus.DRAFT,
        source: "INTERNAL"
      }
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("Error creating job:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}