import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/types/enums"
import ZAI from "z-ai-web-dev-sdk"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"

interface ParsedResumeData {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  skills?: string[]
  experience?: {
    title: string
    company: string
    duration: string
    description?: string
  }[]
  education?: {
    degree: string
    institution: string
    year: string
  }[]
  totalExperience?: number
  currentRole?: string
  currentCTC?: number
  expectedCTC?: number
  preferredLocations?: string[]
  summary?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidate = await db.candidate.findUnique({
      where: { userId: session.user.id }
    })

    if (!candidate) {
      return NextResponse.json({ message: "Candidate profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const resumeFile = formData.get("resume") as File

    if (!resumeFile) {
      return NextResponse.json({ message: "Resume file is required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ 
        message: "Invalid file type. Please upload a PDF or Word document" 
      }, { status: 400 })
    }

    // Save file temporarily
    const uploadsDir = path.join(process.cwd(), "uploads", "temp")
    fs.mkdirSync(uploadsDir, { recursive: true })
    
    const fileExtension = path.extname(resumeFile.name)
    const fileName = `${uuidv4()}${fileExtension}`
    const tempPath = path.join(uploadsDir, fileName)
    
    const bytes = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(tempPath, buffer)

    try {
      // Initialize ZAI SDK
      const zai = await ZAI.create()

      // Create prompt for resume parsing
      const prompt = `
        You are an expert resume parser. Analyze the following resume document and extract the following information in JSON format:
        
        {
          "fullName": "Full name of the candidate",
          "email": "Email address",
          "phone": "Phone number",
          "address": "Full address",
          "skills": ["array of technical and soft skills"],
          "experience": [
            {
              "title": "Job title",
              "company": "Company name", 
              "duration": "Duration (e.g., '2 years', 'Jan 2020 - Present')",
              "description": "Brief description of responsibilities"
            }
          ],
          "education": [
            {
              "degree": "Degree name",
              "institution": "Institution name",
              "year": "Graduation year"
            }
          ],
          "totalExperience": "Total years of experience as a number",
          "currentRole": "Current/most recent job title",
          "currentCTC": "Current salary in LPA (as number)",
          "expectedCTC": "Expected salary in LPA (as number)",
          "preferredLocations": ["array of preferred work locations"],
          "summary": "Professional summary/objective"
        }
        
        Please extract the information accurately and return only the JSON object. If any information is not available in the resume, use null for that field.
      `

      // Read the file and convert to base64
      const fileBuffer = fs.readFileSync(tempPath)
      const base64File = fileBuffer.toString('base64')

      // Use ZAI to parse the resume
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser that extracts structured information from resume documents."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${resumeFile.type};base64,${base64File}`
                }
              }
            ]
          },
          {
            role: "user",
            content: "Please parse this resume and return the structured JSON data."
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })

      const responseContent = completion.choices[0]?.message?.content
      let parsedData: ParsedResumeData = {}

      if (responseContent) {
        try {
          // Extract JSON from response
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0])
          }
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError)
        }
      }

      // Calculate total experience from work history if not directly provided
      if (!parsedData.totalExperience && parsedData.experience) {
        const totalExp = parsedData.experience.reduce((acc, exp) => {
          // Simple parsing - in real implementation, you'd want more sophisticated date parsing
          const durationMatch = exp.duration.match(/(\d+)/)
          if (durationMatch) {
            return acc + parseInt(durationMatch[1])
          }
          return acc
        }, 0)
        parsedData.totalExperience = totalExp
      }

      // Update candidate profile with parsed data
      const updatedCandidate = await db.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName: parsedData.fullName || candidate.fullName,
          phone: parsedData.phone || candidate.phone,
          address: parsedData.address || candidate.address,
          skills: parsedData.skills ? JSON.stringify(parsedData.skills) : candidate.skills,
          totalExperience: parsedData.totalExperience || candidate.totalExperience,
          currentRole: parsedData.currentRole || candidate.currentRole,
          currentCTC: parsedData.currentCTC || candidate.currentCTC,
          expectedCTC: parsedData.expectedCTC || candidate.expectedCTC,
          preferredLocations: parsedData.preferredLocations ? JSON.stringify(parsedData.preferredLocations) : candidate.preferredLocations,
          resumeParsedData: JSON.stringify({
            ...parsedData,
            experience: parsedData.experience,
            education: parsedData.education,
            summary: parsedData.summary,
            parsedAt: new Date().toISOString()
          }),
          profileCompleteness: Math.min(100, (candidate.profileCompleteness || 0) + 20) // Boost completeness
        }
      })

      // Clean up temp file
      fs.unlinkSync(tempPath)

      return NextResponse.json({
        message: "Resume parsed successfully",
        parsedData,
        updatedProfile: updatedCandidate
      })

    } catch (aiError) {
      console.error("AI parsing error:", aiError)
      
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }

      return NextResponse.json({ 
        message: "Failed to parse resume with AI. Please try again or enter information manually." 
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Resume parsing error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}