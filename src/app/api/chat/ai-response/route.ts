import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import ZAI from "z-ai-web-dev-sdk"

interface ChatMessage {
  id: string
  role: string
  message: string
  timestamp: string
  metadata?: any
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      candidateId, 
      projectId, 
      message, 
      senderRole, 
      chatHistory, 
      nonNegotiableCriteria 
    } = await request.json()

    if (!candidateId || !projectId || !message || !senderRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has access
    if (user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get project and candidate details
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { recruiter: true }
    })

    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      include: { user: true }
    })

    if (!project || !candidate) {
      return NextResponse.json({ error: "Project or candidate not found" }, { status: 404 })
    }

    if (project.recruiter.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Build conversation context
    const conversationContext = buildConversationContext(
      chatHistory || [],
      project,
      candidate,
      nonNegotiableCriteria || []
    )

    // Create prompt for AI response
    const prompt = `
You are an AI recruitment assistant for UpJob. Your goal is to engage with candidates professionally, gather necessary information, and move them through the recruitment process efficiently.

CONTEXT:
${conversationContext}

RECENT MESSAGE:
${senderRole === "RECRUITER" ? "Recruiter" : "Candidate"}: "${message}"

NON-NEGOTIABLE CRITERIA:
${nonNegotiableCriteria?.join(", ") || "None specified"}

Your task is to respond to the ${senderRole === "RECRUITER" ? "recruiter's message" : "candidate's message"} as the AI assistant.

GUIDELINES:
1. Be professional, friendly, and concise
2. Keep responses focused on recruitment and the specific job
3. Ask relevant questions to gather missing information
4. Move the conversation forward toward application or next steps
5. If candidate asks about salary range, provide the range from the job details if available
6. If candidate asks about location, clarify remote/hybrid/office options
7. If candidate seems unqualified or doesn't meet criteria, politely explain and suggest alternatives
8. If candidate meets criteria, guide them toward application
9. Detect when human intervention might be needed (complex questions, salary negotiations, etc.)

RESPONSE FORMAT:
Respond with a natural, conversational message. If you detect that human intervention is needed, include a marker in your metadata.

Important: Your response should be helpful and move the conversation forward naturally.
`

    try {
      // Get AI response
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an AI recruitment assistant for UpJob. You help recruiters engage with candidates professionally and efficiently move them through the recruitment process."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })

      const aiResponse = completion.choices[0]?.message?.content || "I understand. Let me help you with that."

      // Analyze if intervention is needed
      const interventionNeeded = detectInterventionNeeded(
        message,
        aiResponse,
        nonNegotiableCriteria || []
      )

      // Check if conversation should be marked as complete
      const conversationComplete = detectConversationComplete(
        chatHistory || [],
        message,
        aiResponse
      )

      const metadata = {
        interventionNeeded,
        conversationComplete,
        confidence: completion.choices[0]?.finish_reason === "stop" ? "high" : "medium",
        timestamp: new Date().toISOString()
      }

      return NextResponse.json({
        message: aiResponse,
        metadata
      })

    } catch (aiError) {
      console.error("Error getting AI response:", aiError)
      
      // Fallback response
      const fallbackResponse = generateFallbackResponse(
        message,
        senderRole,
        project,
        candidate
      )

      return NextResponse.json({
        message: fallbackResponse.message,
        metadata: {
          interventionNeeded: fallbackResponse.interventionNeeded,
          conversationComplete: false,
          confidence: "low",
          error: "AI service unavailable",
          timestamp: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error("Error in AI response generation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function buildConversationContext(
  chatHistory: ChatMessage[],
  project: any,
  candidate: any,
  nonNegotiableCriteria: string[]
): string {
  let context = `JOB DETAILS:
- Title: ${project.title}
- Company: ${project.company}
- Location: ${project.remote ? "Remote" : JSON.parse(project.location || "[]").join(", ")}
- Type: ${project.employmentType}
- Experience Required: ${project.minExperience}-${project.maxExperience} years
- Salary: ${project.minSalary && project.maxSalary ? `$${project.minSalary.toLocaleString()} - $${project.maxSalary.toLocaleString()}` : "Competitive"}

CANDIDATE PROFILE:
- Name: ${candidate.user.name}
- Skills: ${candidate.skills ? JSON.parse(candidate.skills).join(", ") : "Not specified"}
- Location: ${candidate.location || "Not specified"}
- Experience: ${candidate.experience ? "Total years extracted from resume" : "Not specified"}

NON-NEGOTIABLE CRITERIA:
${nonNegotiableCriteria.join("\n")}

RECENT CONVERSATION:
${chatHistory.slice(-5).map(msg => 
  `${msg.role === "CANDIDATE" ? "Candidate" : msg.role === "RECRUITER" ? "Recruiter" : "AI"}: ${msg.message}`
).join("\n")}
`

  return context
}

function detectInterventionNeeded(
  message: string,
  aiResponse: string,
  nonNegotiableCriteria: string[]
): boolean {
  const lowerMessage = message.toLowerCase()
  const lowerResponse = aiResponse.toLowerCase()

  // Detect salary negotiation
  if (lowerMessage.includes("salary") || lowerMessage.includes("compensation") || lowerMessage.includes("pay")) {
    if (lowerMessage.includes("negotiate") || lowerMessage.includes("higher") || lowerMessage.includes("more")) {
      return true
    }
  }

  // Detect complex benefits questions
  if (lowerMessage.includes("benefits") || lowerMessage.includes("insurance") || lowerMessage.includes("401k") || lowerMessage.includes("stock")) {
    return true
  }

  // Detect visa/work authorization questions
  if (lowerMessage.includes("visa") || lowerMessage.includes("sponsorship") || lowerMessage.includes("work authorization")) {
    return true
  }

  // Detect complaints or negative sentiment
  if (lowerMessage.includes("complaint") || lowerMessage.includes("unhappy") || lowerMessage.includes("issue") || lowerMessage.includes("problem")) {
    return true
  }

  // Detect when candidate clearly doesn't meet criteria
  if (nonNegotiableCriteria.some(criteria => 
    lowerMessage.includes("don't have") || lowerMessage.includes("no experience") || lowerMessage.includes("not qualified")
  )) {
    return true
  }

  return false
}

function detectConversationComplete(
  chatHistory: ChatMessage[],
  lastMessage: string,
  aiResponse: string
): boolean {
  const lowerLastMessage = lastMessage.toLowerCase()
  const lowerResponse = aiResponse.toLowerCase()

  // Check if candidate has applied
  if (lowerLastMessage.includes("applied") || lowerLastMessage.includes("submitted")) {
    return true
  }

  // Check if AI has provided application link and candidate acknowledged
  if (lowerResponse.includes("apply here") || lowerResponse.includes("application link")) {
    if (lowerLastMessage.includes("thank") || lowerLastMessage.includes("ok") || lowerLastMessage.includes("will do")) {
      return true
    }
  }

  // Check if candidate has declined or is not interested
  if (lowerLastMessage.includes("not interested") || lowerLastMessage.includes("decline") || lowerLastMessage.includes("no thank")) {
    return true
  }

  return false
}

function generateFallbackResponse(
  message: string,
  senderRole: string,
  project: any,
  candidate: any
): { message: string; interventionNeeded: boolean } {
  const lowerMessage = message.toLowerCase()

  // Simple keyword-based fallback responses
  if (lowerMessage.includes("salary") || lowerMessage.includes("pay")) {
    return {
      message: `The salary range for this position is ${project.minSalary && project.maxSalary ? `$${project.minSalary.toLocaleString()} - $${project.maxSalary.toLocaleString()}` : "competitive and based on experience"}. Is this within your expectations?`,
      interventionNeeded: true
    }
  }

  if (lowerMessage.includes("experience") || lowerMessage.includes("years")) {
    return {
      message: `We're looking for candidates with ${project.minExperience}-${project.maxExperience} years of relevant experience. Could you tell me more about your background?`,
      interventionNeeded: false
    }
  }

  if (lowerMessage.includes("remote") || lowerMessage.includes("location")) {
    return {
      message: project.remote 
        ? "This is a remote position, so you can work from anywhere. Does that work for you?"
        : `This position is based in ${JSON.parse(project.location || "[]").join(", ")}. Are you located nearby or willing to relocate?`,
      interventionNeeded: false
    }
  }

  if (lowerMessage.includes("apply") || lowerMessage.includes("application")) {
    return {
      message: "Great! I'd be happy to help you apply. Let me connect you with our recruitment team who will guide you through the next steps.",
      interventionNeeded: true
    }
  }

  // Default fallback
  return {
    message: "Thank you for your interest in this position. Our recruitment team will review your profile and get back to you soon.",
    interventionNeeded: true
  }
}