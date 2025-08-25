"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Upload,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { UserRole, ApplicationStatus } from "@prisma/client"
import { toast } from "sonner"

interface Job {
  id: string
  title: string
  companyName: string
  description: string
  locations: string[]
  skills: string[]
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  currency: string
  employmentType: string
  workMode: string
  deadline?: string
  status: string
}

interface CustomQuestion {
  id: string
  question: string
  type: string
  options?: string[]
  isMandatory: boolean
  order: number
}

interface ApplicationData {
  coverLetter: string
  resumeFile: File | null
  answers: Record<string, any>
}

export default function ApplyJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get("jobId")
  
  const [job, setJob] = useState<Job | null>(null)
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([])
  const [candidateProfile, setCandidateProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    coverLetter: "",
    resumeFile: null,
    answers: {}
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== UserRole.CANDIDATE) {
      router.push("/auth/signin")
      return
    }

    if (!jobId) {
      router.push("/jobs")
      return
    }

    fetchJobDetails()
    fetchCandidateProfile()
  }, [session, status, router, jobId])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (response.ok) {
        const jobData = await response.json()
        setJob(jobData)
        
        // Fetch custom questions for this job
        const questionsResponse = await fetch(`/api/jobs/${jobId}/questions`)
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json()
          setCustomQuestions(questionsData)
        }
      } else {
        toast.error("Failed to fetch job details")
        router.push("/jobs")
      }
    } catch (error) {
      console.error("Error fetching job details:", error)
      toast.error("An error occurred")
      router.push("/jobs")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCandidateProfile = async () => {
    try {
      const response = await fetch("/api/candidate/profile")
      if (response.ok) {
        const profileData = await response.json()
        setCandidateProfile(profileData)
      }
    } catch (error) {
      console.error("Error fetching candidate profile:", error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ]
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document")
        return
      }

      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB")
        return
      }

      setApplicationData(prev => ({ ...prev, resumeFile: file }))
    }
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setApplicationData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }))
  }

  const validateForm = () => {
    // Check if resume is uploaded
    if (!applicationData.resumeFile && !candidateProfile?.resumePath) {
      toast.error("Please upload your resume")
      return false
    }

    // Check mandatory questions
    for (const question of customQuestions) {
      if (question.isMandatory && !applicationData.answers[question.id]) {
        toast.error(`Please answer the mandatory question: ${question.question}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("jobId", jobId!)
      formData.append("coverLetter", applicationData.coverLetter)
      
      if (applicationData.resumeFile) {
        formData.append("resume", applicationData.resumeFile)
      }

      // Add answers as JSON
      formData.append("answers", JSON.stringify(applicationData.answers))

      const response = await fetch("/api/candidate/applications", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const application = await response.json()
        toast.success("Application submitted successfully!")
        router.push("/candidate/dashboard?tab=applications")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to submit application")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("An error occurred while submitting your application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestionInput = (question: CustomQuestion) => {
    const answer = applicationData.answers[question.id] || ""

    switch (question.type) {
      case "TEXT":
        return (
          <Input
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            required={question.isMandatory}
          />
        )

      case "TEXTAREA":
        return (
          <Textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            rows={3}
            required={question.isMandatory}
          />
        )

      case "DROPDOWN":
        return (
          <Select 
            value={answer} 
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            required={question.isMandatory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={answer === option}
                  onCheckedChange={(checked) => {
                    handleAnswerChange(question.id, checked ? option : "")
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case "CHECKBOX":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const selectedOptions = answer || []
              const isChecked = selectedOptions.includes(option)
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newOptions = checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter((opt: string) => opt !== option)
                      handleAnswerChange(question.id, newOptions)
                    }}
                  />
                  <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                </div>
              )
            })}
          </div>
        )

      case "YES_NO":
        return (
          <Select 
            value={answer} 
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            required={question.isMandatory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select yes or no" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        )

      case "NUMBER":
        return (
          <Input
            type="number"
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value) || 0)}
            placeholder="Enter a number"
            required={question.isMandatory}
          />
        )

      case "DATE":
        return (
          <Input
            type="date"
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.isMandatory}
          />
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Job Not Found</h3>
            <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or is no longer available.</p>
            <Button onClick={() => router.push("/jobs")}>Browse Jobs</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isJobActive = job.status === "ACTIVE"
  const hasDeadlinePassed = job.deadline && new Date(job.deadline) < new Date()

  if (!isJobActive || hasDeadlinePassed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Applications Closed</h3>
            <p className="text-gray-600 mb-4">
              This job is no longer accepting applications.
            </p>
            <Button onClick={() => router.push("/jobs")}>Browse Other Jobs</Button>
          </CardContent>
        </Card>
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
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Apply for Job</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                  <p className="text-lg text-gray-700">{job.companyName}</p>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.locations.join(", ") || "Location not specified"}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {job.salaryMin && job.salaryMax 
                      ? `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                      : "Salary not specified"
                    }
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {job.employmentType} • {job.workMode}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{job.employmentType}</Badge>
                  <Badge variant="outline">{job.workMode}</Badge>
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Resume
              </CardTitle>
              <CardDescription>
                Upload your resume or use your existing profile resume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidateProfile?.resumePath && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">
                      You have a resume on file. You can upload a new one or use the existing one.
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="resume">Upload Resume (PDF or Word)</Label>
                <div className="mt-2">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum file size: 5MB. Accepted formats: PDF, DOC, DOCX
                  </p>
                </div>
              </div>

              {applicationData.resumeFile && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-800">
                        {applicationData.resumeFile.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setApplicationData(prev => ({ ...prev, resumeFile: null }))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
              <CardDescription>
                Tell us why you're interested in this position (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={applicationData.coverLetter}
                onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Write a brief cover letter explaining your interest in this position and why you'd be a good fit..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Custom Questions */}
          {customQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Questions</CardTitle>
                <CardDescription>
                  Please answer the following questions to complete your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {customQuestions
                  .sort((a, b) => a.order - b.order)
                  .map((question) => (
                    <div key={question.id}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Label className="text-sm font-medium">
                          {question.question}
                        </Label>
                        {question.isMandatory && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>
                      {renderQuestionInput(question)}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}