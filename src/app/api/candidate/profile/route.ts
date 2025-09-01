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

    if (session.user.role !== UserRole.JOBSEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const candidate = await db.candidate.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: candidate.id,
      userId: candidate.userId,
      resumeUrl: candidate.resumeUrl,
      parsedResume: candidate.parsedResume,
      skills: candidate.skills ? JSON.parse(candidate.skills as string) : [],
      experience: candidate.experience ? JSON.parse(candidate.experience as string) : [],
      education: candidate.education ? JSON.parse(candidate.education as string) : [],
      preferences: candidate.preferences ? JSON.parse(candidate.preferences as string) : {},
      currentCtc: candidate.currentCtc,
      expectedCtc: candidate.expectedCtc,
      noticePeriod: candidate.noticePeriod,
      location: candidate.location,
      relocate: candidate.relocate,
      summary: candidate.summary,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt
    })
  } catch (error) {
    console.error("Error fetching candidate profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.JOBSEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      summary,
      currentCtc,
      expectedCtc,
      noticePeriod,
      location,
      relocate,
      skills,
      experience,
      education
    } = body

    // Check if candidate profile exists
    let candidate = await db.candidate.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (!candidate) {
      // Create new candidate profile
      candidate = await db.candidate.create({
        data: {
          userId: session.user.id,
          summary,
          currentCtc,
          expectedCtc,
          noticePeriod,
          location,
          relocate,
          skills: JSON.stringify(skills || []),
          experience: JSON.stringify(experience || []),
          education: JSON.stringify(education || [])
        }
      })
    } else {
      // Update existing candidate profile
      candidate = await db.candidate.update({
        where: {
          userId: session.user.id
        },
        data: {
          summary,
          currentCtc,
          expectedCtc,
          noticePeriod,
          location,
          relocate,
          skills: JSON.stringify(skills || []),
          experience: JSON.stringify(experience || []),
          education: JSON.stringify(education || []),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      id: candidate.id,
      userId: candidate.userId,
      resumeUrl: candidate.resumeUrl,
      parsedResume: candidate.parsedResume,
      skills: candidate.skills ? JSON.parse(candidate.skills as string) : [],
      experience: candidate.experience ? JSON.parse(candidate.experience as string) : [],
      education: candidate.education ? JSON.parse(candidate.education as string) : [],
      preferences: candidate.preferences ? JSON.parse(candidate.preferences as string) : {},
      currentCtc: candidate.currentCtc,
      expectedCtc: candidate.expectedCtc,
      noticePeriod: candidate.noticePeriod,
      location: candidate.location,
      relocate: candidate.relocate,
      summary: candidate.summary,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt
    })
  } catch (error) {
    console.error("Error updating candidate profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}