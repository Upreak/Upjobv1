import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, ActionStatus } from "@/types/enums"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const action = await db.actionQueue.findUnique({
      where: { id: params.id },
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
        project: true,
        recruiter: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!action) {
      return NextResponse.json({ message: "Action not found" }, { status: 404 })
    }

    // Check if action belongs to current recruiter
    if (action.recruiter.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const actionWithScore = {
      ...action,
      candidate: action.candidate ? {
        ...action.candidate,
        matchScore: Math.floor(Math.random() * 30) + 70 // Mock match score
      } : null,
      metadata: action.metadata ? JSON.parse(action.metadata) : {}
    }

    return NextResponse.json(actionWithScore)
  } catch (error) {
    console.error("Error fetching action queue item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    // Check if action exists and belongs to current recruiter
    const existingAction = await db.actionQueue.findUnique({
      where: { id: params.id },
      include: {
        recruiter: {
          include: {
            user: true
          }
        }
      }
    })

    if (!existingAction) {
      return NextResponse.json({ message: "Action not found" }, { status: 404 })
    }

    if (existingAction.recruiter.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const updatedAction = await db.actionQueue.update({
      where: { id: params.id },
      data: {
        status: data.status || existingAction.status,
        priority: data.priority || existingAction.priority,
        title: data.title || existingAction.title,
        description: data.description || existingAction.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : existingAction.dueDate,
        completedAt: data.status === ActionStatus.COMPLETED ? new Date() : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : existingAction.metadata
      }
    })

    return NextResponse.json(updatedAction)
  } catch (error) {
    console.error("Error updating action queue item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Check if action exists and belongs to current recruiter
    const existingAction = await db.actionQueue.findUnique({
      where: { id: params.id },
      include: {
        recruiter: {
          include: {
            user: true
          }
        }
      }
    })

    if (!existingAction) {
      return NextResponse.json({ message: "Action not found" }, { status: 404 })
    }

    if (existingAction.recruiter.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await db.actionQueue.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Action deleted successfully" })
  } catch (error) {
    console.error("Error deleting action queue item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}