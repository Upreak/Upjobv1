import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

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

    const candidates = await db.projectCandidate.findMany({
      where: {
        project: {
          recruiterId: recruiter.id
        }
      },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 20
    })

    const recentCandidates = candidates.map(pc => ({
      id: pc.candidate.id,
      fullName: pc.candidate.fullName || pc.candidate.user.name,
      currentRole: pc.candidate.currentRole,
      matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score
      status: pc.status,
      lastContact: pc.updatedAt.toISOString(),
      project: pc.project
    }))

    return NextResponse.json(recentCandidates)
  } catch (error) {
    console.error("Error fetching recent candidates:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}