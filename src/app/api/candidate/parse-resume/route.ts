import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import ZAI from "z-ai-web-dev-sdk"

export async function POST(request: NextRequest) {
  try {
    const { candidateId, resumeUrl } = await request.json()

    if (!candidateId || !resumeUrl) {
      return NextResponse.json(
        { error: "Missing candidateId or resumeUrl" },
        { status: 400 }
      )
    }

    // Fetch the resume content
    let resumeContent
    if (resumeUrl.startsWith("data:")) {
      // Base64 encoded file
      const base64Data = resumeUrl.split(",")[1]
      resumeContent = Buffer.from(base64Data, "base64").toString("utf-8")
    } else {
      // URL-based file - fetch it
      const response = await fetch(resumeUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch resume file")
      }
      resumeContent = await response.text()
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create prompt for resume parsing
    const prompt = `
    You are an expert resume parser. Please analyze the following resume content and extract structured information in JSON format.
    
    Please extract the following information:
    1. Personal Information (name, email, phone, location)
    2. Skills (technical and soft skills)
    3. Work Experience (company, position, duration, responsibilities)
    4. Education (institution, degree, field, graduation year)
    5. Summary/Objective
    6. Total years of experience
    7. Current CTC (if mentioned)
    8. Expected CTC (if mentioned)
    9. Notice period (if mentioned)
    
    Resume Content:
    ${resumeContent}
    
    Please respond with a valid JSON object containing all the extracted information. If any information is not available, use null or empty arrays.
    `

    try {
      // Call ZAI for resume parsing
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser that extracts structured information from resume text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent output
      })

      const aiResponse = completion.choices[0]?.message?.content
      
      if (!aiResponse) {
        throw new Error("No response from AI service")
      }

      // Parse the AI response
      let parsedData
      try {
        parsedData = JSON.parse(aiResponse)
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Failed to parse AI response as JSON")
        }
      }

      // Structure the parsed data for database storage
      const structuredData = {
        personalInfo: {
          name: parsedData.personalInfo?.name || null,
          email: parsedData.personalInfo?.email || null,
          phone: parsedData.personalInfo?.phone || null,
          location: parsedData.personalInfo?.location || null
        },
        skills: parsedData.skills || [],
        experience: parsedData.workExperience || [],
        education: parsedData.education || [],
        summary: parsedData.summary || null,
        totalExperience: parsedData.totalYearsOfExperience || 0,
        currentCtc: parsedData.currentCTC || null,
        expectedCtc: parsedData.expectedCTC || null,
        noticePeriod: parsedData.noticePeriod || null,
        rawResponse: aiResponse
      }

      // Update candidate profile with parsed data
      const updatedCandidate = await db.candidate.update({
        where: { id: candidateId },
        data: {
          parsedResume: structuredData,
          skills: JSON.stringify(structuredData.skills),
          location: structuredData.personalInfo.location,
          currentCtc: structuredData.currentCtc ? parseFloat(structuredData.currentCtc) : null,
          expectedCtc: structuredData.expectedCtc ? parseFloat(structuredData.expectedCtc) : null,
          noticePeriod: structuredData.noticePeriod ? parseInt(structuredData.noticePeriod) : null,
          summary: structuredData.summary
        }
      })

      // Also update the user table with basic info if available
      if (structuredData.personalInfo.name || structuredData.personalInfo.phone) {
        const candidate = await db.candidate.findUnique({
          where: { id: candidateId },
          select: { userId: true }
        })

        if (candidate) {
          await db.user.update({
            where: { id: candidate.userId },
            data: {
              name: structuredData.personalInfo.name || undefined,
              phone: structuredData.personalInfo.phone || undefined
            }
          })
        }
      }

      return NextResponse.json({
        message: "Resume parsed successfully",
        parsedData: structuredData,
        candidate: updatedCandidate
      })

    } catch (aiError) {
      console.error("Error calling AI service:", aiError)
      
      // Fallback: store the raw resume content for manual processing
      await db.candidate.update({
        where: { id: candidateId },
        data: {
          parsedResume: {
            error: "AI parsing failed",
            rawContent: resumeContent,
            timestamp: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({
        message: "Resume uploaded but parsing failed. Manual review required.",
        error: aiError instanceof Error ? aiError.message : "Unknown error"
      }, { status: 202 })
    }

  } catch (error) {
    console.error("Error in resume parsing:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}