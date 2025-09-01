"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Calendar,
  Upload,
  Save,
  X,
  Plus,
  Edit3,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"

interface Experience {
  company: string
  position: string
  duration: string
  description: string
}

interface Education {
  institution: string
  degree: string
  year: string
}

export default function CandidateProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [profile, setProfile] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    summary: "",
    currentCtc: "",
    expectedCtc: "",
    noticePeriod: "",
    location: "",
    relocate: false,
    skills: [] as string[],
    experience: [] as Experience[],
    education: [] as Education[]
  })

  // UI state
  const [newSkill, setNewSkill] = useState("")
  const [newExperience, setNewExperience] = useState<Experience>({
    company: "",
    position: "",
    duration: "",
    description: ""
  })
  const [newEducation, setNewEducation] = useState<Education>({
    institution: "",
    degree: "",
    year: ""
  })

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
    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/candidate/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          summary: data.summary || "",
          currentCtc: data.currentCtc?.toString() || "",
          expectedCtc: data.expectedCtc?.toString() || "",
          noticePeriod: data.noticePeriod?.toString() || "",
          location: data.location || "",
          relocate: data.relocate || false,
          skills: data.skills || [],
          experience: data.experience || [],
          education: data.education || []
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          currentCtc: formData.currentCtc ? parseFloat(formData.currentCtc) : null,
          expectedCtc: formData.expectedCtc ? parseFloat(formData.expectedCtc) : null,
          noticePeriod: formData.noticePeriod ? parseInt(formData.noticePeriod) : null,
        }),
      })

      if (response.ok) {
        setSuccess("Profile updated successfully!")
        toast.success("Profile updated successfully!")
        fetchProfile()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update profile")
        toast.error("Failed to update profile")
      }
    } catch (error) {
      setError("An error occurred while updating profile")
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const addExperience = () => {
    if (newExperience.company && newExperience.position) {
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, newExperience]
      }))
      setNewExperience({
        company: "",
        position: "",
        duration: "",
        description: ""
      })
    }
  }

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, newEducation]
      }))
      setNewEducation({
        institution: "",
        degree: "",
        year: ""
      })
    }
  }

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append("resume", file)

    try {
      const response = await fetch("/api/candidate/resume", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Resume uploaded successfully!")
        fetchProfile()
      } else {
        toast.error("Failed to upload resume")
      }
    } catch (error) {
      toast.error("Error uploading resume")
    } finally {
      setLoading(false)
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
              <span className="ml-4 text-sm text-gray-500">Candidate Profile</span>
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
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Profile
            </h2>
            <p className="text-gray-600">
              Manage your candidate profile and resume to attract the best opportunities.
            </p>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="resume">Resume</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Update your basic profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        placeholder="Brief description of your professional background..."
                        value={formData.summary}
                        onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, State/Country"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentCtc">Current CTC (USD)</Label>
                      <Input
                        id="currentCtc"
                        type="number"
                        placeholder="75000"
                        value={formData.currentCtc}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentCtc: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedCtc">Expected CTC (USD)</Label>
                      <Input
                        id="expectedCtc"
                        type="number"
                        placeholder="90000"
                        value={formData.expectedCtc}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedCtc: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="noticePeriod">Notice Period (days)</Label>
                      <Input
                        id="noticePeriod"
                        type="number"
                        placeholder="30"
                        value={formData.noticePeriod}
                        onChange={(e) => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="relocate"
                        checked={formData.relocate}
                        onChange={(e) => setFormData(prev => ({ ...prev, relocate: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="relocate">Willing to relocate</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>
                    Add your technical and professional skills
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button onClick={addSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Work Experience
                  </CardTitle>
                  <CardDescription>
                    Add your work experience and professional background
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company</Label>
                      <Input
                        placeholder="Company name"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Input
                        placeholder="Job title"
                        value={newExperience.position}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input
                        placeholder="2 years, 6 months"
                        value={newExperience.duration}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, duration: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addExperience} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {formData.experience.map((exp, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{exp.position}</h4>
                            <p className="text-sm text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">{exp.duration}</p>
                            {exp.description && (
                              <p className="text-sm mt-2">{exp.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExperience(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Education
                  </CardTitle>
                  <CardDescription>
                    Add your educational background and qualifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Institution</Label>
                      <Input
                        placeholder="University name"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Degree</Label>
                      <Input
                        placeholder="Bachelor's, Master's, etc."
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addEducation} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {formData.education.map((edu, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{edu.degree}</h4>
                            <p className="text-sm text-gray-600">{edu.institution}</p>
                            <p className="text-sm text-gray-500">{edu.year}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEducation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resume" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Resume Upload
                  </CardTitle>
                  <CardDescription>
                    Upload your resume for AI-powered parsing and profile optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Upload your resume (PDF, DOC, DOCX)
                      </p>
                      <p className="text-xs text-gray-500">
                        Max file size: 5MB
                      </p>
                    </div>
                    <div className="mt-4">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        disabled={loading}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  </div>

                  {profile?.resumeUrl && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Resume uploaded successfully
                          </p>
                          <p className="text-xs text-green-600">
                            {profile.resumeUrl}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-8">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}