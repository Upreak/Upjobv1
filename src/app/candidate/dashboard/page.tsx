"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Bell,
  Settings,
  Plus,
  Search,
  MapPin,
  DollarSign,
  Clock
} from "lucide-react"
import { UserRole } from "@/types/enums"

interface CandidateProfile {
  fullName?: string
  profileCompleteness: number
  currentRole?: string
  expectedRole?: string
  currentCTC?: number
  expectedCTC?: number
  noticePeriod?: number
  preferredLocations?: string[]
  skills?: string[]
}

export default function CandidateDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Please complete your profile to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/candidate/profile")} className="w-full">
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const recommendedJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "Tech Corp",
      location: "San Francisco, CA",
      salary: "$120k - $150k",
      type: "Full-time",
      posted: "2 days ago",
      matchScore: 92
    },
    {
      id: 2,
      title: "Full Stack Engineer",
      company: "StartupXYZ",
      location: "Remote",
      salary: "$100k - $130k",
      type: "Full-time",
      posted: "1 day ago",
      matchScore: 88
    },
    {
      id: 3,
      title: "React Developer",
      company: "Digital Agency",
      location: "New York, NY",
      salary: "$90k - $110k",
      type: "Full-time",
      posted: "3 days ago",
      matchScore: 85
    }
  ]

  const recentApplications = [
    {
      id: 1,
      jobTitle: "Senior Frontend Developer",
      company: "Tech Corp",
      status: "Under Review",
      applied: "2 days ago"
    },
    {
      id: 2,
      jobTitle: "Full Stack Engineer",
      company: "StartupXYZ",
      status: "Shortlisted",
      applied: "1 week ago"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">JobBoard AI</h1>
              <Badge variant="secondary" className="ml-2">Candidate</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {profile.fullName?.charAt(0) || session?.user?.email?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {profile.fullName || session?.user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.fullName || "Candidate"}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your job search journey.
          </p>
        </div>

        {/* Profile Completeness */}
        {profile.profileCompleteness < 100 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                A complete profile helps you get better job matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profile Completeness</span>
                  <span className="text-sm text-gray-600">{profile.profileCompleteness}%</span>
                </div>
                <Progress value={profile.profileCompleteness} className="h-2" />
                <Button onClick={() => router.push("/candidate/profile")} className="w-full">
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Profile Views</p>
                  <p className="text-2xl font-bold text-gray-900">48</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Search className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="recommended" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommended">Recommended Jobs</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Jobs for You</CardTitle>
                <CardDescription>
                  Based on your profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-gray-600">{job.company}</p>
                        </div>
                        <Badge variant="secondary">{job.matchScore}% match</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.posted}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{job.type}</Badge>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">Save</Button>
                          <Button size="sm">Apply Now</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Your Applications</CardTitle>
                <CardDescription>
                  Track the status of your job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
                          <p className="text-gray-600">{app.company}</p>
                        </div>
                        <Badge 
                          variant={
                            app.status === "Shortlisted" ? "default" : 
                            app.status === "Under Review" ? "secondary" : "outline"
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">Applied {app.applied}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
                <CardDescription>
                  Your professional information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {profile.fullName || "Not set"}</div>
                      <div><span className="font-medium">Email:</span> {session?.user?.email}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Career Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Current Role:</span> {profile.currentRole || "Not set"}</div>
                      <div><span className="font-medium">Expected Role:</span> {profile.expectedRole || "Not set"}</div>
                      <div><span className="font-medium">Current CTC:</span> {profile.currentCTC ? `$${profile.currentCTC}k` : "Not set"}</div>
                      <div><span className="font-medium">Expected CTC:</span> {profile.expectedCTC ? `$${profile.expectedCTC}k` : "Not set"}</div>
                      <div><span className="font-medium">Notice Period:</span> {profile.noticePeriod ? `${profile.noticePeriod} days` : "Not set"}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Preferred Locations</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferredLocations?.map((location, index) => (
                        <Badge key={index} variant="outline">{location}</Badge>
                      )) || <span className="text-sm text-gray-500">Not set</span>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      )) || <span className="text-sm text-gray-500">Not set</span>}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button onClick={() => router.push("/candidate/profile")}>
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}