import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, JobStatus } from "@prisma/client"

// GET /api/candidate/recommended-jobs - Get recommended jobs for candidate
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get candidate profile
    const candidate = await db.candidate.findUnique({
      where: { userId: session.user.id }
    })

    if (!candidate) {
      return NextResponse.json({ message: "Candidate profile not found" }, { status: 404 })
    }

    // Get active jobs
    const jobs = await db.job.findMany({
      where: {
        status: JobStatus.ACTIVE,
        deadline: {
          gte: new Date()
        }
      },
      include: {
        recruiter: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        customQuestions: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 jobs for performance
    })

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      const matchScore = calculateMatchScore(candidate, job)
      return {
        ...job,
        matchScore,
        skills: job.skills ? JSON.parse(job.skills) : [],
        locations: job.locations ? JSON.parse(job.locations) : [],
        customQuestions: job.customQuestions.sort((a, b) => a.order - b.order)
      }
    })

    // Sort by match score and filter out low matches
    const recommendedJobs = jobsWithScores
      .filter(job => job.matchScore > 20) // Only show jobs with at least 20% match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10) // Return top 10 recommendations

    return NextResponse.json({
      jobs: recommendedJobs,
      totalJobs: recommendedJobs.length
    })
  } catch (error) {
    console.error("Error fetching recommended jobs:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function calculateMatchScore(candidate: any, job: any): number {
  let score = 0
  let maxScore = 100

  // Skills match (40 points)
  const candidateSkills = candidate.skills ? JSON.parse(candidate.skills) : []
  const jobSkills = job.skills ? JSON.parse(job.skills) : []
  
  if (candidateSkills.length > 0 && jobSkills.length > 0) {
    const matchingSkills = candidateSkills.filter((skill: string) => 
      jobSkills.some((jobSkill: string) => 
        skill.toLowerCase().includes(jobSkill.toLowerCase()) || 
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    )
    score += (matchingSkills.length / Math.max(candidateSkills.length, jobSkills.length)) * 40
  }

  // Experience match (25 points)
  if (candidate.totalExperience && job.experienceMin && job.experienceMax) {
    if (candidate.totalExperience >= job.experienceMin && candidate.totalExperience <= job.experienceMax) {
      score += 25
    } else if (candidate.totalExperience >= job.experienceMin * 0.8 && candidate.totalExperience <= job.experienceMax * 1.2) {
      score += 15
    } else if (candidate.totalExperience >= job.experienceMin * 0.6 && candidate.totalExperience <= job.experienceMax * 1.5) {
      score += 5
    }
  }

  // Salary match (20 points)
  if (candidate.expectedCTC && job.salaryMin && job.salaryMax) {
    if (candidate.expectedCTC >= job.salaryMin && candidate.expectedCTC <= job.salaryMax) {
      score += 20
    } else if (candidate.expectedCTC >= job.salaryMin * 0.8 && candidate.expectedCTC <= job.salaryMax * 1.2) {
      score += 15
    } else if (candidate.expectedCTC >= job.salaryMin * 0.6 && candidate.expectedCTC <= job.salaryMax * 1.5) {
      score += 8
    }
  }

  // Location match (15 points)
  const candidateLocations = candidate.preferredLocations ? JSON.parse(candidate.preferredLocations) : []
  const jobLocations = job.locations ? JSON.parse(job.locations) : []
  
  if (candidateLocations.length > 0 && jobLocations.length > 0) {
    const matchingLocations = candidateLocations.filter((location: string) => 
      jobLocations.some((jobLocation: string) => 
        location.toLowerCase().includes(jobLocation.toLowerCase()) || 
        jobLocation.toLowerCase().includes(location.toLowerCase())
      )
    )
    if (matchingLocations.length > 0) {
      score += 15
    } else if (job.workMode === 'REMOTE' || job.workMode === 'HYBRID') {
      score += 10 // Remote/Hybrid jobs get some points even if location doesn't match
    }
  }

  // Job type match (bonus points)
  if (candidate.jobType && candidate.jobType === job.employmentType) {
    score += 5
  }

  return Math.round(Math.min(score, maxScore))
}