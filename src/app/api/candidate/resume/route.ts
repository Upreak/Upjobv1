import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile } from "fs/promises"
import { join } from "path"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.JOBSEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await request.formData()
    const file: File | null = data.get("resume") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, and DOCX files are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", "resumes")
    
    try {
      await writeFile(join(uploadsDir, file.name), Buffer.from(await file.arrayBuffer()))
    } catch (error) {
      console.error("Error saving file:", error)
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 }
      )
    }

    const resumeUrl = `/uploads/resumes/${file.name}`

    // Update candidate profile with resume URL
    const candidate = await db.candidate.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        resumeUrl,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        resumeUrl
      }
    })

    return NextResponse.json({
      message: "Resume uploaded successfully",
      resumeUrl,
      candidateId: candidate.id
    })
  } catch (error) {
    console.error("Error uploading resume:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}