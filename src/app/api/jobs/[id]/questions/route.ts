import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { QuestionType } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questions = await db.customQuestion.findMany({
      where: { jobId: params.id },
      orderBy: {
        order: "asc"
      }
    })

    const transformedQuestions = questions.map(question => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : []
    }))

    return NextResponse.json(transformedQuestions)
  } catch (error) {
    console.error("Error fetching job questions:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    // Check if job exists and user has permission
    const job = await db.job.findUnique({
      where: { id: params.id },
      include: {
        recruiter: {
          include: {
            user: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 })
    }

    // Check if user is the recruiter who posted the job or an admin
    const hasPermission = session.user.role === "ADMIN" || 
                         session.user.role === "SUPER_ADMIN" ||
                         job.recruiter.userId === session.user.id

    if (!hasPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Validate question data
    if (!data.question || !data.type) {
      return NextResponse.json({ 
        message: "Question and type are required" 
      }, { status: 400 })
    }

    // For dropdown, multiple choice, and checkbox questions, options are required
    if ([QuestionType.DROPDOWN, QuestionType.MULTIPLE_CHOICE, QuestionType.CHECKBOX].includes(data.type)) {
      if (!data.options || !Array.isArray(data.options) || data.options.length === 0) {
        return NextResponse.json({ 
          message: "Options are required for this question type" 
        }, { status: 400 })
      }
    }

    // Get the highest order for this job
    const lastQuestion = await db.customQuestion.findFirst({
      where: { jobId: params.id },
      orderBy: { order: "desc" }
    })

    const order = lastQuestion ? lastQuestion.order + 1 : 0

    const question = await db.customQuestion.create({
      data: {
        jobId: params.id,
        question: data.question,
        type: data.type,
        options: data.options ? JSON.stringify(data.options) : null,
        isMandatory: data.isMandatory || false,
        order: order
      }
    })

    const transformedQuestion = {
      ...question,
      options: question.options ? JSON.parse(question.options) : []
    }

    return NextResponse.json(transformedQuestion, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}