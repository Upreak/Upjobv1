"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar,
  Briefcase,
  Filter,
  ExternalLink,
  Heart,
  Share2,
  Clock
} from "lucide-react"
import Link from "next/link"

interface Job {
  id: string
  title: string
  company: string
  description: string
  location: string[]
  remote: boolean
  minSalary?: number
  maxSalary?: number
  currency: string
  employmentType: string
  minExperience?: number
  maxExperience?: number
  skills: string[]
  createdAt: string
  source: string
  applyUrl: string
}

export default function JobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    location: "",
    experience: "",
    salary: "",
    employmentType: "",
    remote: false
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user.role !== "JOBSEEKER") {
      router.push("/dashboard")
      return
    }
    fetchJobs()
  }, [session, status, router])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        q: searchQuery,
        ...filters
      })
      
      const response = await fetch(`/api/jobs/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      } else {
        setError("Failed to fetch jobs")
      }
    } catch (error) {
      setError("Error fetching jobs")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchJobs()
  }

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      location: "",
      experience: "",
      salary: "",
      employmentType: "",
      remote: false
    })
    setSearchQuery("")
  }

  const saveJob = async (jobId: string) => {
    try {
      const response = await fetch("/api/jobs/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (response.ok) {
        alert("Job saved successfully!")
      }
    } catch (error) {
      alert("Error saving job")
    }
  }

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case "FULL_TIME": return "bg-blue-100 text-blue-800"
      case "PART_TIME": return "bg-green-100 text-green-800"
      case "CONTRACT": return "bg-purple-100 text-purple-800"
      case "INTERNSHIP": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "OUR_BOARD": return { label: "Our Board", color: "bg-indigo-100 text-indigo-800" }
      case "GOOGLE": return { label: "Google", color: "bg-green-100 text-green-800" }
      case "LINKEDIN": return { label: "LinkedIn", color: "bg-blue-100 text-blue-800" }
      default: return { label: source, color: "bg-gray-100 text-gray-800" }
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "JOBSEEKER") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">UpJob</h1>
              <span className="ml-4 text-sm text-gray-500">Job Search</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Find Your Dream Job
              </CardTitle>
              <CardDescription>
                Search through thousands of job opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search jobs by title, company, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City or Remote"
                        value={filters.location}
                        onChange={(e) => handleFilterChange("location", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Select value={filters.experience} onValueChange={(value) => handleFilterChange("experience", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="0-1">0-1 years</SelectItem>
                          <SelectItem value="1-3">1-3 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5+">5+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="salary">Salary Range</Label>
                      <Select value={filters.salary} onValueChange={(value) => handleFilterChange("salary", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select salary" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="0-50000">$0 - $50,000</SelectItem>
                          <SelectItem value="50000-80000">$50,000 - $80,000</SelectItem>
                          <SelectItem value="80000-120000">$80,000 - $120,000</SelectItem>
                          <SelectItem value="120000+">$120,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select value={filters.employmentType} onValueChange={(value) => handleFilterChange("employmentType", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 md:col-span-4">
                      <Checkbox
                        id="remote"
                        checked={filters.remote}
                        onCheckedChange={(checked) => handleFilterChange("remote", checked as boolean)}
                      />
                      <Label htmlFor="remote">Remote only</Label>
                      <Button variant="outline" onClick={clearFilters} className="ml-auto">
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Search Results
              </h3>
              <p className="text-sm text-gray-600">
                {jobs.length} jobs found
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Saved Jobs
              </Button>
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or check back later for new opportunities.
                  </p>
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => {
                const sourceBadge = getSourceBadge(job.source)
                return (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {job.company}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={sourceBadge.color}>
                            {sourceBadge.label}
                          </Badge>
                          <Badge className={getEmploymentTypeColor(job.employmentType)}>
                            {job.employmentType.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {job.description}
                      </p>
                      
                      {/* Job Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                          <span>
                            {job.remote ? "Remote" : job.location.join(", ")}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-gray-500" />
                          <span>
                            {job.minSalary && job.maxSalary 
                              ? `${job.currency} ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}`
                              : "Competitive"
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                          <span>
                            {job.minExperience && job.maxExperience
                              ? `${job.minExperience}-${job.maxExperience} years`
                              : "Experience required"
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-500" />
                          <span>
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {job.skills.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveJob(job.id)}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(job.applyUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => window.open(job.applyUrl, '_blank')}
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}