"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock,
  Save,
  ArrowLeft,
  Plus,
  X,
  Calendar,
  Building
} from "lucide-react"
import { UserRole, JobType, WorkMode, JobStatus } from "@prisma/client"
import { toast } from "sonner"

interface JobFormData {
  title: string
  companyName: string
  description: string
  shortDescription: string
  locations: string[]
  skills: string[]
  experienceMin: number
  experienceMax: number
  salaryMin: number
  salaryMax: number
  currency: string
  employmentType: JobType
  noticePeriod: string
  workMode: WorkMode
  deadline: string
  status: JobStatus
}

const commonSkills = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
  "HTML", "CSS", "Angular", "Vue.js", "Express.js", "MongoDB", "PostgreSQL", "MySQL",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Git", "CI/CD", "Agile",
  "Scrum", "Project Management", "Leadership", "Communication", "Problem Solving",
  "Machine Learning", "Data Science", "DevOps", "Mobile Development", "UI/UX Design"
]

const commonLocations = [
  "San Francisco, CA", "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
  "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX",
  "San Jose, CA", "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH",
  "Remote", "Hybrid"
]

export default function CreateJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    companyName: "",
    description: "",
    shortDescription: "",
    locations: [],
    skills: [],
    experienceMin: 0,
    experienceMax: 0,
    salaryMin: 0,
    salaryMax: 0,
    currency: "USD",
    employmentType: JobType.FULL_TIME,
    noticePeriod: "",
    workMode: WorkMode.ONSITE,
    deadline: "",
    status: JobStatus.DRAFT
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== UserRole.RECRUITER) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSkill = () => {
    if (!newSkill.trim()) return
    handleInputChange("skills", [...formData.skills, newSkill.trim()])
    setNewSkill("")
  }

  const removeSkill = (skillToRemove: string) => {
    handleInputChange("skills", formData.skills.filter(skill => skill !== skillToRemove))
  }

  const addLocation = () => {
    if (!newLocation.trim()) return
    handleInputChange("locations", [...formData.locations, newLocation.trim()])
    setNewLocation("")
  }

  const removeLocation = (locationToRemove: string) => {
    handleInputChange("locations", formData.locations.filter(location => location !== locationToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          locations: JSON.stringify(formData.locations),
          skills: JSON.stringify(formData.skills),
        }),
      })

      if (response.ok) {
        const job = await response.json()
        toast.success("Job created successfully!")
        router.push(`/recruiter/jobs/${job.id}`)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create job")
      }
    } catch (error) {
      console.error("Error creating job:", error)
      toast.error("An error occurred while creating the job")
    } finally {
      setIsLoading(false)
    }
  }

  const saveAsDraft = async () => {
    handleInputChange("status", JobStatus.DRAFT)
    const form = document.querySelector("form") as HTMLFormElement
    if (form) {
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
    }
  }

  const publishJob = async () => {
    handleInputChange("status", JobStatus.ACTIVE)
    const form = document.querySelector("form") as HTMLFormElement
    if (form) {
      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/recruiter/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Create Job Posting</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={saveAsDraft} disabled={isLoading}>
                Save Draft
              </Button>
              <Button onClick={publishJob} disabled={isLoading}>
                {isLoading ? "Publishing..." : "Publish Job"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the basic details about the job position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Senior Frontend Developer"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="e.g., Tech Corp"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  placeholder="Brief summary of the role (appears in job listings)"
                />
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Detailed job description, responsibilities, and requirements..."
                  rows={6}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Job Details
              </CardTitle>
              <CardDescription>
                Specify the requirements and preferences for this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select value={formData.employmentType} onValueChange={(value) => handleInputChange("employmentType", value as JobType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={JobType.FULL_TIME}>Full Time</SelectItem>
                      <SelectItem value={JobType.PART_TIME}>Part Time</SelectItem>
                      <SelectItem value={JobType.CONTRACT}>Contract</SelectItem>
                      <SelectItem value={JobType.REMOTE}>Remote</SelectItem>
                      <SelectItem value={JobType.HYBRID}>Hybrid</SelectItem>
                      <SelectItem value={JobType.INTERNSHIP}>Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workMode">Work Mode *</Label>
                  <Select value={formData.workMode} onValueChange={(value) => handleInputChange("workMode", value as WorkMode)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={WorkMode.REMOTE}>Remote</SelectItem>
                      <SelectItem value={WorkMode.ONSITE}>On-site</SelectItem>
                      <SelectItem value={WorkMode.HYBRID}>Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experienceMin">Minimum Experience (years) *</Label>
                  <Input
                    id="experienceMin"
                    type="number"
                    value={formData.experienceMin}
                    onChange={(e) => handleInputChange("experienceMin", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="experienceMax">Maximum Experience (years)</Label>
                  <Input
                    id="experienceMax"
                    type="number"
                    value={formData.experienceMax}
                    onChange={(e) => handleInputChange("experienceMax", parseFloat(e.target.value) || 0)}
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="noticePeriod">Notice Period</Label>
                <Input
                  id="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={(e) => handleInputChange("noticePeriod", e.target.value)}
                  placeholder="e.g., Immediate, 15 days, 1 month"
                />
              </div>

              <div>
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange("deadline", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Compensation
              </CardTitle>
              <CardDescription>
                Specify the salary range and compensation details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => handleInputChange("salaryMin", parseFloat(e.target.value) || 0)}
                    placeholder="50000"
                  />
                </div>

                <div>
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => handleInputChange("salaryMax", parseFloat(e.target.value) || 0)}
                    placeholder="100000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
              <CardDescription>
                Add the skills required for this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newSkill">Add Skill</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newSkill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Enter a skill"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Common Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={formData.skills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.skills.includes(skill)) {
                          removeSkill(skill)
                        } else {
                          handleInputChange("skills", [...formData.skills, skill])
                        }
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Selected Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center">
                      {skill}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  )) || <span className="text-sm text-gray-500">No skills added</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Job Locations
              </CardTitle>
              <CardDescription>
                Specify where this position is based
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newLocation">Add Location</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newLocation"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Enter a location"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                  />
                  <Button type="button" onClick={addLocation}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Common Locations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonLocations.map((location) => (
                    <Badge
                      key={location}
                      variant={formData.locations.includes(location) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.locations.includes(location)) {
                          removeLocation(location)
                        } else {
                          handleInputChange("locations", [...formData.locations, location])
                        }
                      }}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Selected Locations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.locations.map((location) => (
                    <Badge key={location} variant="secondary" className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeLocation(location)}
                      />
                    </Badge>
                  )) || <span className="text-sm text-gray-500">No locations added</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push("/recruiter/dashboard")}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={saveAsDraft} disabled={isLoading}>
              Save Draft
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Publish Job"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}