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
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        }
      }
    })

    if (!recruiter) {
      return NextResponse.json({ message: "Recruiter profile not found" }, { status: 404 })
    }

    return NextResponse.json(recruiter)
  } catch (error) {
    console.error("Error fetching recruiter profile:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const updatedRecruiter = await db.recruiter.update({
      where: { userId: session.user.id },
      data: {
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        department: data.department,
        designation: data.designation,
        location: data.location,
        bio: data.bio,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json(updatedRecruiter)
  } catch (error) {
    console.error("Error updating recruiter profile:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}