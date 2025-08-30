import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, ChatSessionType, ChatPlatform, MessageType } from "@/types/enums"
import ZAI from "z-ai-web-dev-sdk"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { message, sessionType, platform = ChatPlatform.WEB } = await request.json()

    if (!message) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 })
    }

    // Get user profile based on role
    let userContext: any = {}
    
    if (session.user.role === UserRole.CANDIDATE) {
      const candidate = await db.candidate.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      })
      
      if (candidate) {
        userContext = {
          type: "candidate",
          fullName: candidate.fullName,
          email: candidate.user.email,
          currentRole: candidate.currentRole,
          skills: candidate.skills ? JSON.parse(candidate.skills) : [],
          experience: candidate.totalExperience,
          preferredLocations: candidate.preferredLocations ? JSON.parse(candidate.preferredLocations) : [],
          profileCompleteness: candidate.profileCompleteness
        }
      }
    } else if (session.user.role === UserRole.RECRUITER) {
      const recruiter = await db.recruiter.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      })
      
      if (recruiter) {
        userContext = {
          type: "recruiter",
          companyName: recruiter.companyName,
          email: recruiter.user.email,
          department: recruiter.department,
          designation: recruiter.designation
        }
      }
    }

    // Find or create chat session
    let chatSession = await db.chatSession.findFirst({
      where: {
        userId: session.user.id,
        sessionType,
        platform,
        status: "ACTIVE"
      }
    })

    if (!chatSession) {
      chatSession = await db.chatSession.create({
        data: {
          userId: session.user.id,
          sessionType,
          platform,
          status: "ACTIVE",
          context: JSON.stringify(userContext),
          metadata: JSON.stringify({
            createdAt: new Date().toISOString(),
            userAgent: request.headers.get("user-agent")
          })
        }
      })
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        messageType: MessageType.USER,
        content: message,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      }
    })

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create system prompt based on session type and user context
    let systemPrompt = ""

    switch (sessionType) {
      case ChatSessionType.CANDIDATE_REGISTRATION:
        systemPrompt = `You are an AI assistant helping candidates with registration and profile creation. 
        The user is a candidate. Be helpful, friendly, and guide them through the process.
        Current user context: ${JSON.stringify(userContext)}
        
        Your goal is to help them complete their profile, find jobs, and prepare for applications.
        Keep responses concise and actionable.`
        break

      case ChatSessionType.JOB_SEARCH:
        systemPrompt = `You are a job search assistant helping candidates find suitable positions.
        The user is a candidate looking for job opportunities.
        Current user context: ${JSON.stringify(userContext)}
        
        Use their skills, experience, and preferences to suggest relevant jobs.
        Ask clarifying questions if needed to provide better recommendations.`
        break

      case ChatSessionType.HR_POSTING:
        systemPrompt = `You are an AI assistant helping HR professionals and recruiters with job postings and candidate management.
        The user is a recruiter. Current context: ${JSON.stringify(userContext)}
        
        Help them create effective job descriptions, find suitable candidates, and manage the recruitment process.
        Provide actionable advice and best practices.`
        break

      case ChatSessionType.CANDIDATE_SEARCH:
        systemPrompt = `You are an AI assistant helping recruiters search for and evaluate candidates.
        The user is a recruiter looking for candidates.
        Current context: ${JSON.stringify(userContext)}
        
        Help them understand candidate profiles, match candidates to job requirements, and streamline the search process.`
        break

      default:
        systemPrompt = `You are a helpful AI assistant for the JobBoard AI platform.
        The user context is: ${JSON.stringify(userContext)}
        
        Provide helpful, concise, and actionable responses based on their role and needs.`
    }

    // Get chat history for context
    const recentMessages = await db.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    const chatHistory = recentMessages.reverse().map(msg => ({
      role: msg.messageType === MessageType.USER ? "user" : "assistant",
      content: msg.content
    }))

    // Create messages for AI
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message }
    ]

    // Get AI response
    const completion = await zai.chat.completions.create({
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again."

    // Save AI response
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        messageType: MessageType.BOT,
        content: aiResponse,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          model: completion.model,
          usage: completion.usage
        })
      }
    })

    // Update session metadata
    await db.chatSession.update({
      where: { id: chatSession.id },
      data: {
        metadata: JSON.stringify({
          ...JSON.parse(chatSession.metadata || "{}"),
          lastMessageAt: new Date().toISOString(),
          messageCount: (recentMessages.length + 2)
        })
      }
    })

    return NextResponse.json({
      response: aiResponse,
      sessionId: chatSession.id,
      context: userContext
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ 
      message: "Internal server error",
      response: "I'm sorry, I'm experiencing technical difficulties. Please try again later."
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const sessionType = searchParams.get("sessionType")

    let whereClause: any = {}

    if (sessionId) {
      whereClause.id = sessionId
    } else if (sessionType) {
      whereClause.sessionType = sessionType
      whereClause.userId = session.user.id
    } else {
      whereClause.userId = session.user.id
    }

    const chatSessions = await db.chatSession.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: sessionId ? 1 : 10
    })

    const transformedSessions = chatSessions.map(session => ({
      ...session,
      context: session.context ? JSON.parse(session.context) : {},
      metadata: session.metadata ? JSON.parse(session.metadata) : {},
      messages: session.messages.map(msg => ({
        ...msg,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : {}
      }))
    }))

    return NextResponse.json(transformedSessions)
  } catch (error) {
    console.error("Error fetching chat sessions:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}