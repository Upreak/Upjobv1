import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/types/enums"

// GET /api/recruiter/applications - Get recruiter's applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const jobId = searchParams.get('jobId')

    const whereClause: any = {
      job: {
        recruiterId: session.user.id
      }
    }

    if (status && status !== 'ALL') {
      whereClause.status = status
    }

    if (jobId) {
      whereClause.jobId = jobId
    }

    const [applications, totalCount] = await Promise.all([
      db.application.findMany({
        where: whereClause,
        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              totalExperience: true,
              currentRole: true,
              currentCTC: true,
              expectedCTC: true,
              skills: true,
              preferredLocations: true,
              resumePath: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              companyName: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.application.count({
        where: whereClause
      })
    ])

    // Parse JSON fields
    const parsedApplications = applications.map(application => ({
      ...application,
      answers: application.answers ? JSON.parse(application.answers) : {},
      candidateInfo: application.candidateInfo ? JSON.parse(application.candidateInfo) : {},
      candidate: {
        ...application.candidate,
        skills: application.candidate.skills ? JSON.parse(application.candidate.skills) : [],
        preferredLocations: application.candidate.preferredLocations ? JSON.parse(application.candidate.preferredLocations) : []
      }
    }))

    return NextResponse.json({
      applications: parsedApplications,
      totalCount,
      hasMore: offset + limit < totalCount
    })
  } catch (error) {
    console.error("Error fetching recruiter applications:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/recruiter/applications - Update application status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { applicationId, status, remarks } = data

    if (!applicationId || !status) {
      return NextResponse.json({ 
        message: "Application ID and status are required" 
      }, { status: 400 })
    }

    // Verify the application belongs to the recruiter's job
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            recruiterId: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 })
    }

    if (application.job.recruiterId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Update application status
    const updatedApplication = await db.application.update({
      where: { id: applicationId },
      data: {
        status,
        remarks: remarks || application.remarks
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true // Include candidate email for notifications
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            companyName: true
          }
        }
      }
    })

    // TODO: Send notification to candidate about status change
    // TODO: Log the status change in analytics

    return NextResponse.json({
      application: updatedApplication,
      message: "Application status updated successfully"
    })
  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}