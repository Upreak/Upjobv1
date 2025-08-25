import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { JobStatus, JobType, WorkMode } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get("query") || ""
    const location = searchParams.get("location") || ""
    const jobType = searchParams.get("jobType") || "all"
    const workMode = searchParams.get("workMode") || "all"
    const experienceMin = searchParams.get("experienceMin") || "all"
    const salaryMin = searchParams.get("salaryMin") || "all"
    const sortBy = searchParams.get("sortBy") || "relevance"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      status: JobStatus.ACTIVE
    }

    // Text search
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { companyName: { contains: query, mode: "insensitive" } },
        { skills: { contains: query, mode: "insensitive" } }
      ]
    }

    // Location filter
    if (location) {
      whereClause.locations = {
        contains: location,
        mode: "insensitive"
      }
    }

    // Job type filter
    if (jobType !== "all") {
      whereClause.employmentType = jobType as JobType
    }

    // Work mode filter
    if (workMode !== "all") {
      whereClause.workMode = workMode as WorkMode
    }

    // Experience filter
    if (experienceMin !== "all") {
      const minExp = parseFloat(experienceMin)
      whereClause.experienceMin = { gte: minExp }
    }

    // Salary filter
    if (salaryMin !== "all") {
      const minSalary = parseFloat(salaryMin)
      whereClause.OR = [
        { salaryMin: { gte: minSalary } },
        { salaryMax: { gte: minSalary } }
      ]
    }

    // Build order by clause
    let orderBy: any = { createdAt: "desc" }
    
    switch (sortBy) {
      case "date":
        orderBy = { createdAt: "desc" }
        break
      case "salary_high":
        orderBy = { salaryMax: "desc" }
        break
      case "salary_low":
        orderBy = { salaryMin: "asc" }
        break
      case "relevance":
      default:
        // For relevance, we'll sort by creation date (newest first)
        // In a real implementation, you might want to implement full-text search scoring
        orderBy = { createdAt: "desc" }
        break
    }

    const [jobs, totalCount] = await Promise.all([
      db.job.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      db.job.count({
        where: whereClause
      })
    ])

    // Transform jobs for frontend
    const transformedJobs = jobs.map(job => ({
      ...job,
      locations: job.locations ? JSON.parse(job.locations) : [],
      skills: job.skills ? JSON.parse(job.skills) : [],
      applicationCount: job._count.applications
    }))

    return NextResponse.json({
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Error searching jobs:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}