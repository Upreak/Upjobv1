"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Settings,
  Upload,
  Search,
  Bell,
  TrendingUp
} from "lucide-react"
import Link from "next/link"

export default function CandidateDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [candidateData, setCandidateData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "JOBSEEKER") {
      router.push("/auth/signin")
      return
    }

    // Fetch candidate data
    fetchCandidateData()
  }, [session, status, router])

  const fetchCandidateData = async () => {
    try {
      const response = await fetch("/api/candidate/profile")
      if (response.ok) {
        const data = await response.json()
        setCandidateData(data)
      }
    } catch (error) {
      console.error("Error fetching candidate data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your job search.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 viewed this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              1 scheduled this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Matches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              5 new matches today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="matches">Job Matches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Completion
                </CardTitle>
                <CardDescription>
                  Complete your profile to get better job matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Basic Information</span>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Resume</span>
                    <Badge variant={candidateData?.resumeUrl ? "secondary" : "outline"}>
                      {candidateData?.resumeUrl ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${candidateData?.resumeUrl ? "bg-green-600 w-full" : "bg-yellow-600 w-3/4"}`}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Skills</span>
                    <Badge variant={candidateData?.skills?.length > 0 ? "secondary" : "outline"}>
                      {candidateData?.skills?.length > 0 ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${candidateData?.skills?.length > 0 ? "bg-green-600 w-full" : "bg-yellow-600 w-1/2"}`}></div>
                  </div>
                </div>
                
                <Link href="/dashboard/candidate/profile">
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    {candidateData?.resumeUrl ? "Update Resume" : "Upload Resume"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest job search activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Application viewed by TechCorp</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New job match: Senior Developer</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Interview scheduled with StartupXYZ</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your profile information and resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-gray-900">{session?.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-gray-900">{session?.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <p className="text-gray-900">{candidateData?.location || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Current CTC</label>
                    <p className="text-gray-900">{candidateData?.currentCtc ? `$${candidateData.currentCtc}` : "Not provided"}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidateData?.skills?.length > 0 ? (
                      candidateData.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills added</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Link href="/dashboard/candidate/profile">
                    <Button>Edit Profile</Button>
                  </Link>
                  <Link href="/dashboard/candidate/profile">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      {candidateData?.resumeUrl ? "Update Resume" : "Upload Resume"}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>
                Track your job applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No applications yet. Start searching for jobs!</p>
              <Link href="/jobs">
                <Button className="mt-4">
                  <Search className="h-4 w-4 mr-2" />
                  Search Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Matches</CardTitle>
              <CardDescription>
                Jobs that match your profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Loading job matches...</p>
              <Link href="/jobs">
                <Button className="mt-4">
                  <Search className="h-4 w-4 mr-2" />
                  Browse All Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}