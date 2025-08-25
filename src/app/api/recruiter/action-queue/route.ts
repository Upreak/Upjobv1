import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, ActionStatus, ActionType } from "@prisma/client"

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
    const priority = searchParams.get("priority")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const whereClause: any = {
      recruiterId: recruiter.id
    }

    if (status && status !== "all") {
      whereClause.status = status
    }

    if (priority && priority !== "all") {
      whereClause.priority = priority
    }

    const [actions, totalCount] = await Promise.all([
      db.actionQueue.findMany({
        where: whereClause,
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
          project: true
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" }
        ],
        skip: offset,
        take: limit
      }),
      db.actionQueue.count({
        where: whereClause
      })
    ])

    // Calculate match scores for candidates (mock data for now)
    const actionsWithScores = actions.map(action => ({
      ...action,
      candidate: action.candidate ? {
        ...action.candidate,
        matchScore: Math.floor(Math.random() * 30) + 70 // Mock match score 70-100%
      } : null
    }))

    return NextResponse.json({
      actions: actionsWithScores,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching action queue:", error)
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
      where: { userId: session.user.id }
    })

    if (!recruiter) {
      return NextResponse.json({ message: "Recruiter profile not found" }, { status: 404 })
    }

    const data = await request.json()

    const action = await db.actionQueue.create({
      data: {
        recruiterId: recruiter.id,
        type: data.type as ActionType,
        title: data.title,
        description: data.description,
        priority: data.priority || "MEDIUM",
        status: ActionStatus.PENDING,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        candidateId: data.candidateId,
        projectId: data.projectId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    })

    return NextResponse.json(action, { status: 201 })
  } catch (error) {
    console.error("Error creating action queue item:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}