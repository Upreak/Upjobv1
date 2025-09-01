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

    const { messageId, feedback, candidateId, projectId } = await request.json()

    if (!messageId || !feedback || !candidateId || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has access to this chat
    if (user.role === UserRole.RECRUITER) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { recruiter: true }
      })
      if (!project || project.recruiter.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Find the chat message
    const chatMessage = await db.chatMessage.findUnique({
      where: { id: messageId }
    })

    if (!chatMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Update message metadata with feedback
    const updatedMetadata = {
      ...(chatMessage.metadata || {}),
      feedback,
      feedbackGivenAt: new Date().toISOString(),
      feedbackGivenBy: user.id
    }

    await db.chatMessage.update({
      where: { id: messageId },
      data: {
        metadata: updatedMetadata
      }
    })

    // Log feedback for analytics
    try {
      await db.searchLog.create({
        data: {
          userId: user.id,
          query: "chat_feedback",
          filters: {
            messageId,
            feedback,
            candidateId,
            projectId
          },
          results: 1,
          sources: ["CHAT"],
          providers: ["FEEDBACK"]
        }
      })
    } catch (logError) {
      console.error("Error logging chat feedback:", logError)
    }

    return NextResponse.json({
      message: "Feedback recorded successfully",
      feedback
    })
  } catch (error) {
    console.error("Error recording chat feedback:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}