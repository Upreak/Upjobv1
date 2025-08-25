import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// POST /api/candidate/upload-resume - Upload candidate resume
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('resume') as unknown as File

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        message: "Invalid file type. Only PDF, DOC, and DOCX files are allowed." 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        message: "File size exceeds 5MB limit." 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes')
    const filePath = path.join(uploadsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      await writeFile(filePath, buffer)
    } catch (error) {
      console.error("Error saving file:", error)
      return NextResponse.json({ message: "Error saving file" }, { status: 500 })
    }

    // Update candidate profile with resume path
    const resumePath = `/uploads/resumes/${fileName}`
    
    const candidate = await db.candidate.update({
      where: { userId: session.user.id },
      data: {
        resumePath: resumePath,
        // TODO: Implement actual resume parsing here
        // For now, we'll just store some dummy parsed data
        resumeParsedData: JSON.stringify({
          parsedAt: new Date().toISOString(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          // This would be replaced with actual parsed data from an AI service
          extractedData: {
            skills: ["JavaScript", "React", "Node.js"],
            experience: "5 years",
            education: "Bachelor's in Computer Science"
          }
        })
      }
    })

    // Calculate profile completeness
    const completeness = calculateProfileCompleteness(candidate)

    return NextResponse.json({
      resumePath: resumePath,
      resumeParsedData: candidate.resumeParsedData,
      profileCompleteness: completeness,
      message: "Resume uploaded successfully"
    })
  } catch (error) {
    console.error("Error uploading resume:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function calculateProfileCompleteness(candidate: any): number {
  let completeness = 0
  const totalFields = 15
  let completedFields = 0

  // Check essential fields
  if (candidate.fullName) completedFields++
  if (candidate.phone) completedFields++
  if (candidate.dateOfBirth) completedFields++
  if (candidate.totalExperience !== null && candidate.totalExperience !== undefined) completedFields++
  if (candidate.currentRole) completedFields++
  if (candidate.expectedRole) completedFields++
  if (candidate.skills && JSON.parse(candidate.skills).length > 0) completedFields++
  if (candidate.preferredLocations && JSON.parse(candidate.preferredLocations).length > 0) completedFields++
  if (candidate.currentCTC !== null && candidate.currentCTC !== undefined) completedFields++
  if (candidate.expectedCTC !== null && candidate.expectedCTC !== undefined) completedFields++
  if (candidate.noticePeriod !== null && candidate.noticePeriod !== undefined) completedFields++
  if (candidate.jobType) completedFields++
  if (candidate.workType) completedFields++
  if (candidate.resumePath) completedFields++

  completeness = Math.round((completedFields / totalFields) * 100)
  return Math.min(completeness, 100)
}