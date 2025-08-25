"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  User, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock,
  Save,
  ArrowLeft,
  Plus,
  X
} from "lucide-react"
import { UserRole, JobType, WorkType, SectorType, Gender, ContactMode } from "@prisma/client"
import { toast } from "sonner"

interface CandidateProfile {
  fullName?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  gender?: Gender
  maritalStatus?: string
  languages?: string[]
  totalExperience?: number
  currentRole?: string
  expectedRole?: string
  currentCTC?: number
  expectedCTC?: number
  noticePeriod?: number
  skills?: string[]
  certifications?: string[]
  education?: string[]
  workHistory?: string[]
  preferredLocations?: string[]
  preferredIndustries?: string[]
  jobType?: JobType
  workType?: WorkType
  readyToRelocate?: boolean
  lookingAbroad?: boolean
  sectorType?: SectorType
  reservationCategory?: string
  hobbies?: string[]
  bio?: string
  hasCurrentOffers?: boolean
  bestTimeToContact?: string
  preferredContact?: ContactMode
  profileCompleteness: number
}

const commonSkills = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
  "HTML", "CSS", "Angular", "Vue.js", "Express.js", "MongoDB", "PostgreSQL", "MySQL",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Git", "CI/CD", "Agile",
  "Scrum", "Project Management", "Leadership", "Communication", "Problem Solving"
]

const commonLocations = [
  "San Francisco, CA", "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
  "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX",
  "San Jose, CA", "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH"
]

export default function CandidateProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [newLocation, setNewLocation] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== UserRole.CANDIDATE) {
      router.push("/auth/signin")
      return
    }

    fetchCandidateProfile()
  }, [session, status, router])

  const fetchCandidateProfile = async () => {
    try {
      const response = await fetch("/api/candidate/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<CandidateProfile>) => {
    if (!profile) return

    try {
      setIsSaving(true)
      const response = await fetch("/api/candidate/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        toast.success("Profile updated successfully")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!profile) return
    updateProfile({ [field]: value })
  }

  const addSkill = () => {
    if (!profile || !newSkill.trim()) return
    
    const skills = [...(profile.skills || []), newSkill.trim()]
    updateProfile({ skills })
    setNewSkill("")
  }

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return
    
    const skills = (profile.skills || []).filter(skill => skill !== skillToRemove)
    updateProfile({ skills })
  }

  const addLocation = () => {
    if (!profile || !newLocation.trim()) return
    
    const locations = [...(profile.preferredLocations || []), newLocation.trim()]
    updateProfile({ preferredLocations: locations })
    setNewLocation("")
  }

  const removeLocation = (locationToRemove: string) => {
    if (!profile) return
    
    const locations = (profile.preferredLocations || []).filter(location => location !== locationToRemove)
    updateProfile({ preferredLocations: locations })
  }

  const calculateProfileCompleteness = (profile: CandidateProfile): number => {
    const fields = [
      profile.fullName,
      profile.phone,
      profile.currentRole,
      profile.expectedRole,
      profile.skills?.length,
      profile.preferredLocations?.length,
      profile.totalExperience,
      profile.currentCTC,
      profile.expectedCTC
    ]
    
    const completedFields = fields.filter(field => field && (Array.isArray(field) ? field.length > 0 : true)).length
    return Math.round((completedFields / fields.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/candidate/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
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
              <Button variant="ghost" onClick={() => router.push("/candidate/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            </div>
            <Button 
              onClick={() => updateProfile(profile)} 
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Completeness */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Complete your profile</span>
                <span className="text-sm text-gray-600">{profile.profileCompleteness}%</span>
              </div>
              <Progress value={profile.profileCompleteness} className="h-2" />
              <p className="text-sm text-gray-600">
                A complete profile helps you get better job matches and increases your visibility to recruiters.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic information about you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.fullName || ""}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter your address"
                />
              </div>
              
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth || ""}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={profile.gender || ""} onValueChange={(value) => handleInputChange("gender", value as Gender)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Gender.MALE}>Male</SelectItem>
                    <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                    <SelectItem value={Gender.OTHER}>Other</SelectItem>
                    <SelectItem value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Input
                  id="maritalStatus"
                  value={profile.maritalStatus || ""}
                  onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                  placeholder="Enter marital status"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Your career details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="totalExperience">Total Experience (years)</Label>
                <Input
                  id="totalExperience"
                  type="number"
                  value={profile.totalExperience || ""}
                  onChange={(e) => handleInputChange("totalExperience", parseFloat(e.target.value) || 0)}
                  placeholder="Enter total years of experience"
                />
              </div>
              
              <div>
                <Label htmlFor="currentRole">Current Role</Label>
                <Input
                  id="currentRole"
                  value={profile.currentRole || ""}
                  onChange={(e) => handleInputChange("currentRole", e.target.value)}
                  placeholder="Enter your current role"
                />
              </div>
              
              <div>
                <Label htmlFor="expectedRole">Expected Role</Label>
                <Input
                  id="expectedRole"
                  value={profile.expectedRole || ""}
                  onChange={(e) => handleInputChange("expectedRole", e.target.value)}
                  placeholder="Enter your expected role"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentCTC">Current CTC (k USD)</Label>
                  <Input
                    id="currentCTC"
                    type="number"
                    value={profile.currentCTC || ""}
                    onChange={(e) => handleInputChange("currentCTC", parseFloat(e.target.value) || 0)}
                    placeholder="Current salary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expectedCTC">Expected CTC (k USD)</Label>
                  <Input
                    id="expectedCTC"
                    type="number"
                    value={profile.expectedCTC || ""}
                    onChange={(e) => handleInputChange("expectedCTC", parseFloat(e.target.value) || 0)}
                    placeholder="Expected salary"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="noticePeriod">Notice Period (days)</Label>
                <Input
                  id="noticePeriod"
                  type="number"
                  value={profile.noticePeriod || ""}
                  onChange={(e) => handleInputChange("noticePeriod", parseInt(e.target.value) || 0)}
                  placeholder="Notice period in days"
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Add your technical and professional skills</CardDescription>
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
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  />
                  <Button onClick={addSkill}>
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
                      variant={profile.skills?.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (profile.skills?.includes(skill)) {
                          removeSkill(skill)
                        } else {
                          const skills = [...(profile.skills || []), skill]
                          updateProfile({ skills })
                        }
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Your Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills?.map((skill) => (
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

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>Your work preferences and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={profile.jobType || ""} onValueChange={(value) => handleInputChange("jobType", value as JobType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
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
                <Label htmlFor="workType">Work Type</Label>
                <Select value={profile.workType || ""} onValueChange={(value) => handleInputChange("workType", value as WorkType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WorkType.GOVERNMENT}>Government</SelectItem>
                    <SelectItem value={WorkType.PRIVATE}>Private</SelectItem>
                    <SelectItem value={WorkType.GOV_PVT}>Government & Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="readyToRelocate"
                  checked={profile.readyToRelocate || false}
                  onCheckedChange={(checked) => handleInputChange("readyToRelocate", checked)}
                />
                <Label htmlFor="readyToRelocate">Ready to relocate</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lookingAbroad"
                  checked={profile.lookingAbroad || false}
                  onCheckedChange={(checked) => handleInputChange("lookingAbroad", checked)}
                />
                <Label htmlFor="lookingAbroad">Looking for opportunities abroad</Label>
              </div>
            </CardContent>
          </Card>

          {/* Preferred Locations */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Preferred Locations</CardTitle>
              <CardDescription>Where would you like to work?</CardDescription>
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
                    onKeyPress={(e) => e.key === "Enter" && addLocation()}
                  />
                  <Button onClick={addLocation}>
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
                      variant={profile.preferredLocations?.includes(location) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (profile.preferredLocations?.includes(location)) {
                          removeLocation(location)
                        } else {
                          const locations = [...(profile.preferredLocations || []), location]
                          updateProfile({ preferredLocations: locations })
                        }
                      }}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Your Preferred Locations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.preferredLocations?.map((location) => (
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

          {/* Additional Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Other details that might help in job matching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="bestTimeToContact">Best Time to Contact</Label>
                <Input
                  id="bestTimeToContact"
                  value={profile.bestTimeToContact || ""}
                  onChange={(e) => handleInputChange("bestTimeToContact", e.target.value)}
                  placeholder="e.g., 9 AM - 6 PM"
                />
              </div>
              
              <div>
                <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                <Select value={profile.preferredContact || ""} onValueChange={(value) => handleInputChange("preferredContact", value as ContactMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ContactMode.CALL}>Call</SelectItem>
                    <SelectItem value={ContactMode.WHATSAPP}>WhatsApp</SelectItem>
                    <SelectItem value={ContactMode.EMAIL}>Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}