import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get recruiter profile
    const recruiter = await db.recruiter.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 })
    }

    // Get recruiter's projects
    const projects = await db.project.findMany({
      where: {
        recruiterId: recruiter.id
      },
      include: {
        _count: {
          select: {
            applications: true,
            projectCandidates: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching recruiter projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      company,
      description,
      minExperience,
      maxExperience,
      minSalary,
      maxSalary,
      currency,
      location,
      remote,
      employmentType,
      noticePeriod,
      skills,
      criteria,
      customQuestions
    } = body

    // Get recruiter profile
    const recruiter = await db.recruiter.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 })
    }

    // Create new project
    const project = await db.project.create({
      data: {
        title,
        company,
        description,
        minExperience,
        maxExperience,
        minSalary,
        maxSalary,
        currency,
        location: JSON.stringify(location || []),
        remote,
        employmentType,
        noticePeriod,
        skills: JSON.stringify(skills || []),
        criteria: JSON.stringify(criteria || {}),
        customQuestions: JSON.stringify(customQuestions || []),
        recruiterId: recruiter.id,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      id: project.id,
      title: project.title,
      company: project.company,
      status: project.status,
      createdAt: project.createdAt
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}