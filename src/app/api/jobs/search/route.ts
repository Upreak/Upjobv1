import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.JOBSEEKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const location = searchParams.get('location') || ''
    const experience = searchParams.get('experience') || ''
    const salary = searchParams.get('salary') || ''
    const employmentType = searchParams.get('employmentType') || ''
    const remote = searchParams.get('remote') === 'true'

    // Get all active projects
    const projects = await db.project.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        recruiter: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform projects to job format
    const jobs = projects.map(project => {
      const skills = project.skills ? JSON.parse(project.skills as string) : []
      const locations = project.location ? JSON.parse(project.location as string) : []
      
      return {
        id: project.id,
        title: project.title,
        company: project.company,
        description: project.description,
        location: locations,
        remote: project.remote,
        minSalary: project.minSalary,
        maxSalary: project.maxSalary,
        currency: project.currency || 'USD',
        employmentType: project.employmentType,
        minExperience: project.minExperience,
        maxExperience: project.maxExperience,
        skills: skills,
        createdAt: project.createdAt.toISOString(),
        source: 'OUR_BOARD',
        applyUrl: `/jobs/${project.id}`
      }
    })

    // Filter jobs based on search criteria
    let filteredJobs = jobs

    // Search query filter
    if (query) {
      const searchTerms = query.toLowerCase().split(' ')
      filteredJobs = filteredJobs.filter(job => {
        const searchableText = `${job.title} ${job.company} ${job.description} ${job.skills.join(' ')}`.toLowerCase()
        return searchTerms.every(term => searchableText.includes(term))
      })
    }

    // Location filter
    if (location) {
      filteredJobs = filteredJobs.filter(job => 
        job.remote || job.location.some(loc => 
          loc.toLowerCase().includes(location.toLowerCase())
        )
      )
    }

    // Remote filter
    if (remote) {
      filteredJobs = filteredJobs.filter(job => job.remote)
    }

    // Experience filter
    if (experience) {
      const [minExp, maxExp] = experience.split('-').map(Number)
      filteredJobs = filteredJobs.filter(job => {
        if (!job.minExperience && !job.maxExperience) return false
        const jobMinExp = job.minExperience || 0
        const jobMaxExp = job.maxExperience || Infinity
        
        if (experience.includes('+')) {
          return jobMinExp >= minExp
        } else {
          return jobMinExp <= maxExp && jobMaxExp >= minExp
        }
      })
    }

    // Salary filter
    if (salary) {
      const [minSal, maxSal] = salary.split('-').map(Number)
      filteredJobs = filteredJobs.filter(job => {
        if (!job.minSalary && !job.maxSalary) return false
        const jobMinSal = job.minSalary || 0
        const jobMaxSal = job.maxSalary || Infinity
        
        if (salary.includes('+')) {
          return jobMinSal >= minSal
        } else {
          return jobMinSal <= maxSal && jobMaxSal >= minSal
        }
      })
    }

    // Employment type filter
    if (employmentType) {
      filteredJobs = filteredJobs.filter(job => 
        job.employmentType === employmentType
      )
    }

    // Sort by relevance (simple implementation - prioritize exact matches)
    if (query) {
      filteredJobs.sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(query.toLowerCase())
        const bTitleMatch = b.title.toLowerCase().includes(query.toLowerCase())
        
        if (aTitleMatch && !bTitleMatch) return -1
        if (!aTitleMatch && bTitleMatch) return 1
        
        return 0
      })
    }

    return NextResponse.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      query,
      filters: {
        location,
        experience,
        salary,
        employmentType,
        remote
      }
    })
  } catch (error) {
    console.error("Error searching jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}