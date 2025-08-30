"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock,
  Briefcase,
  Filter,
  SortAsc,
  Bookmark,
  ExternalLink,
  Calendar
} from "lucide-react"
import { UserRole, JobType, WorkMode } from "@/types/enums"
import { toast } from "sonner"

interface Job {
  id: string
  title: string
  companyName: string
  description: string
  shortDescription?: string
  locations: string[]
  skills: string[]
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  currency: string
  employmentType: JobType
  workMode: WorkMode
  deadline?: string
  status: string
  createdAt: string
  applicationCount?: number
  isSaved?: boolean
}

interface SearchFilters {
  query: string
  location: string
  jobType: string
  workMode: string
  experienceMin: string
  salaryMin: string
  sortBy: string
}

const jobTypes = [
  { value: "all", label: "All Types" },
  { value: JobType.FULL_TIME, label: "Full Time" },
  { value: JobType.PART_TIME, label: "Part Time" },
  { value: JobType.CONTRACT, label: "Contract" },
  { value: JobType.REMOTE, label: "Remote" },
  { value: JobType.HYBRID, label: "Hybrid" },
  { value: JobType.INTERNSHIP, label: "Internship" }
]

const workModes = [
  { value: "all", label: "All Modes" },
  { value: WorkMode.REMOTE, label: "Remote" },
  { value: WorkMode.ONSITE, label: "On-site" },
  { value: WorkMode.HYBRID, label: "Hybrid" }
]

const experienceLevels = [
  { value: "all", label: "All Levels" },
  { value: "0", label: "Entry Level (0-2 years)" },
  { value: "2", label: "Mid Level (2-5 years)" },
  { value: "5", label: "Senior Level (5+ years)" }
]

const salaryRanges = [
  { value: "all", label: "All Salaries" },
  { value: "0", label: "Under $50k" },
  { value: "50000", label: "$50k - $75k" },
  { value: "75000", label: "$75k - $100k" },
  { value: "100000", label: "$100k - $150k" },
  { value: "150000", label: "Over $150k" }
]

const sortOptions = [
  { value: "relevance", label: "Most Relevant" },
  { value: "date", label: "Most Recent" },
  { value: "salary_high", label: "Highest Salary" },
  { value: "salary_low", label: "Lowest Salary" }
]

export default function JobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    location: "",
    jobType: "all",
    workMode: "all",
    experienceMin: "all",
    salaryMin: "all",
    sortBy: "relevance"
  })
  const [showFilters, setShowFilters] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === "loading") return
    fetchJobs()
  }, [filters, status])

  useEffect(() => {
    if (session?.user?.role === UserRole.CANDIDATE) {
      fetchSavedJobs()
    }
  }, [session])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value)
        }
      })

      const response = await fetch(`/api/jobs/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
      } else {
        toast.error("Failed to fetch jobs")
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSavedJobs = async () => {
    try {
      const response = await fetch("/api/candidate/saved-jobs")
      if (response.ok) {
        const data = await response.json()
        setSavedJobs(new Set(data.map((job: any) => job.jobId)))
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error)
    }
  }

  const toggleSaveJob = async (jobId: string) => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    try {
      const isCurrentlySaved = savedJobs.has(jobId)
      const method = isCurrentlySaved ? "DELETE" : "POST"
      
      const response = await fetch("/api/candidate/saved-jobs", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (response.ok) {
        const newSavedJobs = new Set(savedJobs)
        if (isCurrentlySaved) {
          newSavedJobs.delete(jobId)
          toast.success("Job removed from saved list")
        } else {
          newSavedJobs.add(jobId)
          toast.success("Job saved successfully")
        }
        setSavedJobs(newSavedJobs)
      } else {
        toast.error("Failed to update saved jobs")
      }
    } catch (error) {
      console.error("Error toggling saved job:", error)
      toast.error("An error occurred")
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      location: "",
      jobType: "all",
      workMode: "all",
      experienceMin: "all",
      salaryMin: "all",
      sortBy: "relevance"
    })
  }

  const applyToJob = (jobId: string) => {
    if (!session) {
      router.push("/auth/signin")
      return
    }
    router.push(`/jobs/${jobId}/apply`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getSalaryRange = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return "Salary not specified"
    if (job.salaryMin && job.salaryMax) {
      return `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
    }
    if (job.salaryMin) return `${job.currency} ${job.salaryMin.toLocaleString()}+`
    if (job.salaryMax) return `Up to ${job.currency} ${job.salaryMax.toLocaleString()}`
    return "Salary not specified"
  }

  const getExperienceRange = (job: Job) => {
    if (!job.experienceMin && !job.experienceMax) return "Experience not specified"
    if (job.experienceMin && job.experienceMax) {
      return `${job.experienceMin} - ${job.experienceMax} years`
    }
    if (job.experienceMin) return `${job.experienceMin}+ years`
    if (job.experienceMax) return `Up to ${job.experienceMax} years`
    return "Experience not specified"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">JobBoard AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user?.role === UserRole.CANDIDATE && (
                <Button variant="outline" onClick={() => router.push("/candidate/dashboard")}>
                  Dashboard
                </Button>
              )}
              {!session && (
                <Button onClick={() => router.push("/auth/signin")}>Sign In</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search jobs by title, company, or keywords..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange("query", e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-12"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                <SelectTrigger className="w-40 h-12">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Location</Label>
                <Input
                  placeholder="City or remote"
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Job Type</Label>
                <Select value={filters.jobType} onValueChange={(value) => handleFilterChange("jobType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Work Mode</Label>
                <Select value={filters.workMode} onValueChange={(value) => handleFilterChange("workMode", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workModes.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Experience</Label>
                <Select value={filters.experienceMin} onValueChange={(value) => handleFilterChange("experienceMin", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Salary Range</Label>
                <Select value={filters.salaryMin} onValueChange={(value) => handleFilterChange("salaryMin", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {salaryRanges.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Job Search Results</h2>
            <p className="text-gray-600 mt-1">
              {isLoading ? "Searching..." : `Found ${jobs.length} jobs`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-lg text-gray-700 mb-2">{job.companyName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSaveJob(job.id)}
                          className="ml-4"
                        >
                          <Bookmark 
                            className={`h-4 w-4 ${
                              savedJobs.has(job.id) ? "fill-blue-600 text-blue-600" : ""
                            }`} 
                          />
                        </Button>
                      </div>
                      
                      {job.shortDescription && (
                        <p className="text-gray-600 mb-4">{job.shortDescription}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.locations.length > 0 ? job.locations.join(", ") : "Location not specified"}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {getSalaryRange(job)}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {getExperienceRange(job)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(job.createdAt)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline">{job.employmentType}</Badge>
                        <Badge variant="outline">{job.workMode}</Badge>
                        {job.skills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                        {job.skills.length > 5 && (
                          <Badge variant="secondary">+{job.skills.length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {job.applicationCount !== undefined && (
                        <span>{job.applicationCount} applicants</span>
                      )}
                      {job.deadline && (
                        <span className="ml-4">
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => applyToJob(job.id)}
                        disabled={job.status !== "ACTIVE"}
                      >
                        {job.status === "ACTIVE" ? "Apply Now" : "Not Accepting Applications"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}