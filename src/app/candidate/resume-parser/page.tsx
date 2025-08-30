"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  User,
  Briefcase,
  MapPin,
  DollarSign,
  Clock
} from "lucide-react"
import { UserRole } from "@/types/enums"
import { toast } from "sonner"

interface ParsedResumeData {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  skills?: string[]
  experience?: Array<{
    title: string
    company: string
    duration: string
    description?: string
  }>
  education?: Array<{
    degree: string
    institution: string
    year: string
  }>
  totalExperience?: number
  currentRole?: string
  currentCTC?: number
  expectedCTC?: number
  preferredLocations?: string[]
  summary?: string
}

interface ParseResult {
  message: string
  parsedData?: ParsedResumeData
  updatedProfile?: any
}

export default function ResumeParserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isParsing, setIsParsing] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== UserRole.CANDIDATE) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)
    setParseResult(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const parseResume = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first")
      return
    }

    setIsParsing(true)

    try {
      const formData = new FormData()
      formData.append("resume", selectedFile)

      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      })

      const result: ParseResult = await response.json()

      if (response.ok) {
        setParseResult(result)
        toast.success("Resume parsed successfully!")
      } else {
        toast.error(result.message || "Failed to parse resume")
      }
    } catch (error) {
      console.error("Error parsing resume:", error)
      toast.error("An error occurred while parsing your resume")
    } finally {
      setIsParsing(false)
    }
  }

  const updateProfile = async () => {
    if (!parseResult?.parsedData) return

    try {
      const response = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parseResult.parsedData),
      })

      if (response.ok) {
        toast.success("Profile updated successfully!")
        router.push("/candidate/profile")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("An error occurred while updating your profile")
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
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">AI Resume Parser</h1>
              <Badge variant="secondary">Beta</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            AI-Powered Resume Analysis
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume and let our AI extract key information to automatically populate your profile. 
            Save time and ensure accuracy with intelligent parsing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume in PDF or Word format for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? "border-blue-400 bg-blue-50" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                
                {!selectedFile ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your resume here, or click to browse
                    </p>
                    <input
                      type="file"
                      id="resume-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="resume-upload">
                      <Button className="cursor-pointer">
                        Choose File
                      </Button>
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-blue-600 mr-2" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button 
                      onClick={() => setSelectedFile(null)} 
                      variant="outline"
                      size="sm"
                    >
                      Remove File
                    </Button>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="mt-6">
                  <Button 
                    onClick={parseResume} 
                    disabled={isParsing}
                    className="w-full"
                  >
                    {isParsing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Parsing Resume...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Parse with AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Parsed Information
              </CardTitle>
              <CardDescription>
                Review and confirm the extracted information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isParsing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing your resume with AI...</p>
                </div>
              ) : parseResult ? (
                <div className="space-y-6">
                  {parseResult.parsedData ? (
                    <>
                      {/* Personal Information */}
                      {(parseResult.parsedData.fullName || parseResult.parsedData.email || parseResult.parsedData.phone) && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Personal Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            {parseResult.parsedData.fullName && (
                              <div><span className="font-medium">Name:</span> {parseResult.parsedData.fullName}</div>
                            )}
                            {parseResult.parsedData.email && (
                              <div><span className="font-medium">Email:</span> {parseResult.parsedData.email}</div>
                            )}
                            {parseResult.parsedData.phone && (
                              <div><span className="font-medium">Phone:</span> {parseResult.parsedData.phone}</div>
                            )}
                            {parseResult.parsedData.address && (
                              <div><span className="font-medium">Address:</span> {parseResult.parsedData.address}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Professional Information */}
                      {(parseResult.parsedData.currentRole || parseResult.parsedData.totalExperience) && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Professional Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            {parseResult.parsedData.currentRole && (
                              <div><span className="font-medium">Current Role:</span> {parseResult.parsedData.currentRole}</div>
                            )}
                            {parseResult.parsedData.totalExperience && (
                              <div><span className="font-medium">Experience:</span> {parseResult.parsedData.totalExperience} years</div>
                            )}
                            {parseResult.parsedData.currentCTC && (
                              <div><span className="font-medium">Current CTC:</span> {parseResult.parsedData.currentCTC} LPA</div>
                            )}
                            {parseResult.parsedData.expectedCTC && (
                              <div><span className="font-medium">Expected CTC:</span> {parseResult.parsedData.expectedCTC} LPA</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {parseResult.parsedData.skills && parseResult.parsedData.skills.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {parseResult.parsedData.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preferred Locations */}
                      {parseResult.parsedData.preferredLocations && parseResult.parsedData.preferredLocations.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Preferred Locations
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {parseResult.parsedData.preferredLocations.map((location, index) => (
                              <Badge key={index} variant="outline">{location}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience Summary */}
                      {parseResult.parsedData.experience && parseResult.parsedData.experience.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Experience</h3>
                          <div className="space-y-2">
                            {parseResult.parsedData.experience.slice(0, 3).map((exp, index) => (
                              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                                <div className="font-medium">{exp.title} at {exp.company}</div>
                                <div className="text-gray-600">{exp.duration}</div>
                                {exp.description && (
                                  <div className="text-gray-500 text-xs mt-1">{exp.description}</div>
                                )}
                              </div>
                            ))}
                            {parseResult.parsedData.experience.length > 3 && (
                              <div className="text-sm text-gray-500">
                                +{parseResult.parsedData.experience.length - 3} more positions
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {parseResult.parsedData.education && parseResult.parsedData.education.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Education</h3>
                          <div className="space-y-2">
                            {parseResult.parsedData.education.map((edu, index) => (
                              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                                <div className="font-medium">{edu.degree}</div>
                                <div className="text-gray-600">{edu.institution} • {edu.year}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <Button onClick={updateProfile} className="w-full">
                          Update Profile with Parsed Data
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Parsing Complete</h3>
                      <p className="text-gray-600 mb-4">{parseResult.message}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
                  <p className="text-gray-600">
                    Upload your resume and click "Parse with AI" to see the extracted information here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What Our AI Parser Extracts</CardTitle>
            <CardDescription>
              Our advanced AI analyzes your resume to extract comprehensive information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium mb-1">Personal Details</h3>
                <p className="text-sm text-gray-600">Name, contact info, address</p>
              </div>
              <div className="text-center">
                <Briefcase className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-medium mb-1">Experience</h3>
                <p className="text-sm text-gray-600">Work history, roles, duration</p>
              </div>
              <div className="text-center">
                <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-medium mb-1">Preferences</h3>
                <p className="text-sm text-gray-600">Locations, salary expectations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}