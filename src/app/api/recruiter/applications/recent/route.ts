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

    const applications = await db.application.findMany({
      where: {
        job: {
          recruiterId: recruiter.id
        }
      },
      include: {
        job: {
          select: {
            title: true
          }
        },
        candidate: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    })

    const recentApplications = applications.map(app => ({
      id: app.id,
      jobTitle: app.job.title,
      candidateName: app.candidate.fullName || app.candidate.user.name || "Unknown",
      status: app.status,
      applied: new Date(app.createdAt).toLocaleDateString(),
      matchScore: Math.floor(Math.random() * 30) + 70 // Mock match score for now
    }))

    return NextResponse.json(recentApplications)
  } catch (error) {
    console.error("Error fetching recent applications:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}