import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { UserRole, ActionType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const actionItems = await db.actionQueue.findMany({
      where: {
        assignedTo: user.id,
        status: "PENDING"
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            company: true
          }
        },
        candidate: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" }
      ]
    })

    const formattedActionItems = actionItems.map(item => {
      let priority: "high" | "medium" | "low" = "medium"
      
      // Determine priority based on type and due date
      if (item.type === ActionType.CHAT_INTERVENTION || item.type === ActionType.PARSE_FAILURE) {
        priority = "high"
      } else if (item.dueDate && new Date(item.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        priority = "high"
      } else if (item.type === ActionType.NO_RESPONSE) {
        priority = "medium"
      } else {
        priority = "low"
      }

      return {
        id: item.id,
        type: item.type,
        title: generateActionTitle(item.type, item.project, item.candidate),
        description: item.description || generateActionDescription(item.type, item.project, item.candidate),
        priority,
        dueDate: item.dueDate?.toISOString(),
        project: item.project?.title,
        candidate: item.candidate?.user.name
      }
    })

    return NextResponse.json(formattedActionItems)
  } catch (error) {
    console.error("Error fetching action queue:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { actionId, status, notes } = await request.json()

    const actionItem = await db.actionQueue.update({
      where: { id: actionId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
        metadata: notes ? { notes } : undefined
      }
    })

    return NextResponse.json(actionItem)
  } catch (error) {
    console.error("Error updating action item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function generateActionTitle(type: ActionType, project?: any, candidate?: any): string {
  switch (type) {
    case ActionType.NEW_MATCHES:
      return `New matches for ${project?.title || "project"}`
    case ActionType.CHAT_FOLLOW_UP:
      return `Chat follow-up with ${candidate?.user?.name || "candidate"}`
    case ActionType.NO_RESPONSE:
      return `No response from ${candidate?.user?.name || "candidate"}`
    case ActionType.PARSE_FAILURE:
      return `Resume parse failure`
    case ActionType.CHAT_INTERVENTION:
      return `Chat intervention needed for ${candidate?.user?.name || "candidate"}`
    default:
      return "Action required"
  }
}

function generateActionDescription(type: ActionType, project?: any, candidate?: any): string {
  switch (type) {
    case ActionType.NEW_MATCHES:
      return `Review ${candidate?.user?.name || "new candidates"} for ${project?.title || "project"}`
    case ActionType.CHAT_FOLLOW_UP:
      return `Review chatbot conversation with ${candidate?.user?.name || "candidate"} - reply not understood`
    case ActionType.NO_RESPONSE:
      return `Manual follow-up needed: ${candidate?.user?.name || "candidate"} has not responded to the bot`
    case ActionType.PARSE_FAILURE:
      return `1 resume failed to parse. Manual data entry required.`
    case ActionType.CHAT_INTERVENTION:
      return `${candidate?.user?.name || "candidate"} requires chat intervention for ${project?.title || "project"}`
    default:
      return "Manual intervention required"
  }
}