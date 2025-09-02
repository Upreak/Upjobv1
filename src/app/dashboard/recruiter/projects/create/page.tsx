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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar,
  Save,
  X,
  Plus,
  Star,
  Settings
} from "lucide-react"
import { toast } from "sonner"

interface CustomQuestion {
  id: string
  question: string
  required: boolean
  type: string
}

export default function CreateProject() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    minExperience: "",
    maxExperience: "",
    minSalary: "",
    maxSalary: "",
    currency: "USD",
    location: [] as string[],
    remote: false,
    employmentType: "FULL_TIME",
    noticePeriod: "",
    skills: [] as string[],
    criteria: {
      mandatory: [] as string[],
      negotiable: [] as string[]
    },
    customQuestions: [] as CustomQuestion[]
  })

  // UI state
  const [newSkill, setNewSkill] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [newMandatorySkill, setNewMandatorySkill] = useState("")
  const [newNegotiableSkill, setNewNegotiableSkill] = useState("")
  const [newQuestion, setNewQuestion] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user.role !== "RECRUITER") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  const handleSaveProject = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/recruiter/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          minExperience: formData.minExperience ? parseInt(formData.minExperience) : null,
          maxExperience: formData.maxExperience ? parseInt(formData.maxExperience) : null,
          minSalary: formData.minSalary ? parseFloat(formData.minSalary) : null,
          maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : null,
          noticePeriod: formData.noticePeriod ? parseInt(formData.noticePeriod) : null,
        }),
      })

      if (response.ok) {
        setSuccess("Project created successfully!")
        toast.success("Project created successfully!")
        setTimeout(() => {
          router.push("/dashboard/recruiter")
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create project")
        toast.error("Failed to create project")
      }
    } catch (error) {
      setError("An error occurred while creating project")
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

  const addLocation = () => {
    if (newLocation.trim() && !formData.location.includes(newLocation.trim())) {
      setFormData(prev => ({
        ...prev,
        location: [...prev.location, newLocation.trim()]
      }))
      setNewLocation("")
    }
  }

  const removeLocation = (locationToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      location: prev.location.filter(loc => loc !== locationToRemove)
    }))
  }

  const addMandatorySkill = () => {
    if (newMandatorySkill.trim() && !formData.criteria.mandatory.includes(newMandatorySkill.trim())) {
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          mandatory: [...prev.criteria.mandatory, newMandatorySkill.trim()]
        }
      }))
      setNewMandatorySkill("")
    }
  }

  const addNegotiableSkill = () => {
    if (newNegotiableSkill.trim() && !formData.criteria.negotiable.includes(newNegotiableSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          negotiable: [...prev.criteria.negotiable, newNegotiableSkill.trim()]
        }
      }))
      setNewNegotiableSkill("")
    }
  }

  const removeMandatorySkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        mandatory: prev.criteria.mandatory.filter(skill => skill !== skillToRemove)
      }
    }))
  }

  const removeNegotiableSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        negotiable: prev.criteria.negotiable.filter(skill => skill !== skillToRemove)
      }
    }))
  }

  const addQuestion = () => {
    if (newQuestion.trim()) {
      const question: CustomQuestion = {
        id: `q${formData.customQuestions.length + 1}`,
        question: newQuestion.trim(),
        required: true,
        type: "text"
      }
      setFormData(prev => ({
        ...prev,
        customQuestions: [...prev.customQuestions, question]
      }))
      setNewQuestion("")
    }
  }

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== questionId)
    }))
  }

  const toggleQuestionRequired = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(q => 
        q.id === questionId ? { ...q, required: !q.required } : q
      )
    }))
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "RECRUITER") {
    return null
  }

  return (
    <div className="space-y-6">
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

      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Job Posting
        </h2>
        <p className="text-gray-600">
          Post a new job opening to attract qualified candidates.
        </p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="criteria">Star Criteria</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
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
                        placeholder="Software Engineer"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        placeholder="TechCorp Inc."
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Job Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Detailed job description..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select value={formData.employmentType} onValueChange={(value) => setFormData(prev => ({ ...prev, employmentType: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERNSHIP">Internship</SelectItem>
                          <SelectItem value="FREELANCE">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location & Remote Work
                  </CardTitle>
                  <CardDescription>
                    Specify job location and remote work options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remote"
                      checked={formData.remote}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, remote: checked as boolean }))}
                    />
                    <Label htmlFor="remote">This position allows remote work</Label>
                  </div>
                  
                  <div>
                    <Label>Job Locations</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add location..."
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                      />
                      <Button onClick={addLocation}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.location.map((location, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {location}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeLocation(location)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Compensation
                  </CardTitle>
                  <CardDescription>
                    Set salary range and currency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="minSalary">Minimum Salary</Label>
                      <Input
                        id="minSalary"
                        type="number"
                        placeholder="80000"
                        value={formData.minSalary}
                        onChange={(e) => setFormData(prev => ({ ...prev, minSalary: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxSalary">Maximum Salary</Label>
                      <Input
                        id="maxSalary"
                        type="number"
                        placeholder="120000"
                        value={formData.maxSalary}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxSalary: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger className="mt-1">
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Experience Requirements
                  </CardTitle>
                  <CardDescription>
                    Set experience requirements for the position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minExperience">Minimum Experience (years)</Label>
                      <Input
                        id="minExperience"
                        type="number"
                        placeholder="3"
                        value={formData.minExperience}
                        onChange={(e) => setFormData(prev => ({ ...prev, minExperience: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxExperience">Maximum Experience (years)</Label>
                      <Input
                        id="maxExperience"
                        type="number"
                        placeholder="7"
                        value={formData.maxExperience}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxExperience: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                  <CardDescription>
                    Add skills required for this position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a required skill..."
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

            <TabsContent value="criteria" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Star Criteria System
                  </CardTitle>
                  <CardDescription>
                    Set mandatory and negotiable criteria for candidate evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">Mandatory Requirements (Yellow Star)</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add mandatory skill..."
                        value={newMandatorySkill}
                        onChange={(e) => setNewMandatorySkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addMandatorySkill()}
                      />
                      <Button onClick={addMandatorySkill}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.criteria.mandatory.map((skill, index) => (
                        <Badge key={index} variant="default" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3" />
                          {skill}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeMandatorySkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Negotiable Requirements (Grey Star)</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add negotiable skill..."
                        value={newNegotiableSkill}
                        onChange={(e) => setNewNegotiableSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNegotiableSkill()}
                      />
                      <Button onClick={addNegotiableSkill}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.criteria.negotiable.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {skill}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeNegotiableSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Custom Questions
                  </CardTitle>
                  <CardDescription>
                    Add custom questions for candidates to answer when applying
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a custom question..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                    />
                    <Button onClick={addQuestion}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.customQuestions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{question.question}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Checkbox
                                id={`required-${question.id}`}
                                checked={question.required}
                                onCheckedChange={() => toggleQuestionRequired(question.id)}
                              />
                              <Label htmlFor={`required-${question.id}`} className="text-sm">
                                Required
                              </Label>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
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
          </Tabs>

          <div className="flex justify-end mt-8">
            <Button onClick={handleSaveProject} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Job Posting
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}