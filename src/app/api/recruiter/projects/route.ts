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

    const projects = await db.project.findMany({
      where: { recruiterId: recruiter.id },
      include: {
        _count: {
          select: {
            projectCandidates: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const projectsWithCounts = projects.map(project => ({
      ...project,
      candidateCount: project._count.projectCandidates
    }))

    return NextResponse.json(projectsWithCounts)
  } catch (error) {
    console.error("Error fetching recruiter projects:", error)
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

    const project = await db.project.create({
      data: {
        workspaceId: recruiter.workspaceId || "",
        recruiterId: recruiter.id,
        title: data.title,
        clientName: data.clientName,
        spocName: data.spocName,
        spocEmail: data.spocEmail,
        spocPhone: data.spocPhone,
        description: data.description,
        status: data.status || "WIP",
        remarks: data.remarks,
        criteria: data.criteria ? JSON.stringify(data.criteria) : null,
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}