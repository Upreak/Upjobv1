import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { candidateId, projectId, message, role, metadata } = await request.json()

    if (!candidateId || !projectId || !message || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has access to this chat
    if (user.role === UserRole.JOBSEEKER && role !== "CANDIDATE") {
      return NextResponse.json({ error: "Candidates can only send candidate messages" }, { status: 403 })
    }

    if (user.role === UserRole.RECRUITER && role !== "RECRUITER" && role !== "BOT") {
      return NextResponse.json({ error: "Recruiters can only send recruiter or bot messages" }, { status: 403 })
    }

    // Verify access permissions
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

    // Get recruiter ID if this is a recruiter or bot message
    let recruiterId = null
    if (role === "RECRUITER" || role === "BOT") {
      const recruiter = await db.recruiter.findUnique({
        where: { userId: user.id }
      })
      recruiterId = recruiter?.id || null
    }

    // Create the message
    const chatMessage = await db.chatMessage.create({
      data: {
        candidateId,
        projectId,
        recruiterId,
        userId: user.id,
        role,
        message,
        status: "sent",
        metadata
      }
    })

    // Update chat status
    let chatStatus = "ACTIVE"
    if (metadata?.interventionNeeded) {
      chatStatus = "INTERVENTION_NEEDED"
    } else if (metadata?.conversationComplete) {
      chatStatus = "COMPLETED"
    }

    // Create or update action queue if intervention is needed
    if (metadata?.interventionNeeded) {
      await db.actionQueue.upsert({
        where: {
          candidateId_projectId_type: {
            candidateId,
            projectId,
            type: "CHAT_INTERVENTION"
          }
        },
        update: {
          status: "PENDING",
          title: `Chat intervention needed for ${candidateId}`,
          description: `AI bot requires human intervention in conversation with candidate`,
          assignedTo: user.id
        },
        create: {
          candidateId,
          projectId,
          type: "CHAT_INTERVENTION",
          title: `Chat intervention needed for ${candidateId}`,
          description: `AI bot requires human intervention in conversation with candidate`,
          status: "PENDING",
          assignedTo: user.id
        }
      })
    }

    // Emit real-time message via socket.io if available
    try {
      // This would typically integrate with your socket.io setup
      // io.to(`chat:${candidateId}:${projectId}`).emit("new-message", chatMessage)
    } catch (socketError) {
      console.error("Error emitting socket event:", socketError)
    }

    return NextResponse.json({
      message: "Message sent successfully",
      chatMessage,
      chatStatus
    })
  } catch (error) {
    console.error("Error sending chat message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}