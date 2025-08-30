"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Bell,
  Settings,
  Plus,
  Search,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react"
import { UserRole } from "@/types/enums"

interface RecruiterProfile {
  companyName?: string
  companyEmail?: string
  department?: string
  designation?: string
  location?: string
  bio?: string
}

interface JobStats {
  totalJobs: number
  activeJobs: number
  totalApplications: number
  newApplications: number
}

interface Project {
  id: string
  title: string
  clientName: string
  status: string
  createdAt: string
  candidateCount: number
}

interface RecentApplication {
  id: string
  jobTitle: string
  candidateName: string
  status: string
  applied: string
  matchScore?: number
}

export default function RecruiterDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<RecruiterProfile | null>(null)
  const [jobStats, setJobStats] = useState<JobStats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== UserRole.RECRUITER) {
      router.push("/auth/signin")
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const profileResponse = await fetch("/api/recruiter/profile")
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData)
      }

      // Fetch job statistics
      const statsResponse = await fetch("/api/recruiter/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setJobStats(statsData)
      }

      // Fetch projects
      const projectsResponse = await fetch("/api/recruiter/projects")
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
      }

      // Fetch recent applications
      const applicationsResponse = await fetch("/api/recruiter/applications/recent")
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        setRecentApplications(applicationsData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
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
            <Button onClick={() => router.push("/recruiter/profile")} className="w-full">
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "wip":
        return "default"
      case "completed":
      case "win":
        return "default"
      case "pending":
      case "hold":
        return "secondary"
      case "closed":
      case "lost":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">JobBoard AI</h1>
              <Badge variant="secondary" className="ml-2">Recruiter</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {profile.companyName?.charAt(0) || session?.user?.email?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {profile.companyName || session?.user?.email}
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
            Welcome back, {profile.companyName || "Recruiter"}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your recruitment activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats?.totalJobs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats?.activeJobs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats?.totalApplications || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{jobStats?.newApplications || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>
                    Latest candidate applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentApplications.slice(0, 5).map((app) => (
                      <div key={app.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{app.candidateName}</h4>
                            <p className="text-sm text-gray-600">{app.jobTitle}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {app.matchScore && (
                              <Badge variant="secondary">{app.matchScore}%</Badge>
                            )}
                            <Badge variant={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Applied {app.applied}</p>
                      </div>
                    ))}
                    {recentApplications.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No recent applications
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Active Projects
                  </CardTitle>
                  <CardDescription>
                    Your ongoing recruitment projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.filter(p => p.status === "WIP").slice(0, 5).map((project) => (
                      <div key={project.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{project.title}</h4>
                            <p className="text-sm text-gray-600">{project.clientName}</p>
                          </div>
                          <Badge variant={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{project.candidateCount} candidates</span>
                          <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {projects.filter(p => p.status === "WIP").length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No active projects
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Projects</CardTitle>
                    <CardDescription>
                      Manage your recruitment projects and client requirements
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <p className="text-gray-600">{project.clientName}</p>
                        </div>
                        <Badge variant={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {project.candidateCount} candidates
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          <Button size="sm">Manage</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-600 mb-4">Create your first recruitment project to get started</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Review and manage candidate applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{app.candidateName}</h3>
                          <p className="text-gray-600">{app.jobTitle}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {app.matchScore && (
                            <Badge variant="secondary">{app.matchScore}% match</Badge>
                          )}
                          <Badge variant={getStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Applied {app.applied}</p>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm">View Profile</Button>
                          <Button size="sm">Review</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentApplications.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-600 mb-4">Post a job to start receiving applications</p>
                      <Button onClick={() => router.push("/recruiter/jobs/create")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Post Job
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Job Postings</CardTitle>
                    <CardDescription>
                      Manage your job postings and reach qualified candidates
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push("/recruiter/jobs/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Job Management</h3>
                  <p className="text-gray-600 mb-4">Create and manage your job postings</p>
                  <Button onClick={() => router.push("/recruiter/jobs/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job Posting
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