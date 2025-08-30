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
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Briefcase
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { UserRole } from "@/types/enums"
import { toast } from "sonner"

export default function RecruiterProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<any>({})

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (user?.role !== UserRole.RECRUITER) {
      router.push("/auth/signin")
      return
    }

    loadProfile()
  }, [session, user, router])

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/recruiter/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const updateProfile = async (updatedData: any) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/recruiter/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        toast.success("Profile updated successfully!")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile(profile)
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">JobBoard AI</h1>
              <nav className="ml-10 flex space-x-8">
                <a href="/recruiter/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/recruiter/jobs" className="text-gray-600 hover:text-gray-900">My Jobs</a>
                <a href="/recruiter/candidates" className="text-gray-600 hover:text-gray-900">Candidates</a>
                <a href="/recruiter/applications" className="text-gray-600 hover:text-gray-900">Applications</a>
                <a href="/recruiter/workspace" className="text-gray-600 hover:text-gray-900">Workspace</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/recruiter/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Profile</h1>
          <p className="text-gray-600">Manage your professional information and company details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.user?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter your location"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profile.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g., Talent Acquisition, HR Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={profile.designation || ''}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    placeholder="e.g., Senior Recruiter, HR Manager"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Your company details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={profile.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={profile.companyEmail || ''}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    placeholder="Enter your company email"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio / Description</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about your company and recruitment focus"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                  <Select 
                    value={profile.preferredContact || ''} 
                    onValueChange={(value) => handleInputChange('preferredContact', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="BOTH">Both Email & Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Additional Information
              </CardTitle>
              <CardDescription>
                Extra details to help candidates understand your recruitment needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="industryFocus">Industry Focus</Label>
                <Input
                  id="industryFocus"
                  value={profile.industryFocus || ''}
                  onChange={(e) => handleInputChange('industryFocus', e.target.value)}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Select 
                  value={profile.teamSize || ''} 
                  onValueChange={(value) => handleInputChange('teamSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 people</SelectItem>
                    <SelectItem value="6-20">6-20 people</SelectItem>
                    <SelectItem value="21-50">21-50 people</SelectItem>
                    <SelectItem value="51-200">51-200 people</SelectItem>
                    <SelectItem value="200+">200+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hiringVolume">Monthly Hiring Volume</Label>
                <Select 
                  value={profile.hiringVolume || ''} 
                  onValueChange={(value) => handleInputChange('hiringVolume', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select typical monthly hiring volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 positions</SelectItem>
                    <SelectItem value="6-20">6-20 positions</SelectItem>
                    <SelectItem value="21-50">21-50 positions</SelectItem>
                    <SelectItem value="50+">50+ positions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button type="button" variant="outline" onClick={() => router.push("/recruiter/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}