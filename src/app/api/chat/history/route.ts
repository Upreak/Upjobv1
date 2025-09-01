import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get("candidateId")
    const projectId = searchParams.get("projectId")

    if (!candidateId || !projectId) {
      return NextResponse.json({ error: "Candidate ID and Project ID are required" }, { status: 400 })
    }

    // Verify user has access to this chat
    if (user.role === UserRole.JOBSEEKER) {
      const candidate = await db.candidate.findUnique({
        where: { userId: user.id }
      })
      if (!candidate || candidate.id !== candidateId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (user.role === UserRole.RECRUITER) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { recruiter: true }
      })
      if (!project || project.recruiter.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const messages = await db.chatMessage.findMany({
      where: {
        candidateId,
        projectId
      },
      include: {
        candidate: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        recruiter: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      message: msg.message,
      timestamp: msg.createdAt.toISOString(),
      status: msg.status,
      metadata: msg.metadata
    }))

    return NextResponse.json({
      messages: formattedMessages,
      candidate: messages[0]?.candidate,
      project: messages[0]?.project
    })
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}