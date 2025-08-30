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
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Plus,
  Filter,
  Search,
  MessageSquare,
  Calendar,
  Target,
  Zap
} from "lucide-react"
import { UserRole } from "@/types/enums"
import { toast } from "sonner"

interface ActionQueueItem {
  id: string
  type: string
  title: string
  description: string
  priority: string
  status: string
  dueDate?: string
  candidate?: {
    id: string
    fullName: string
    currentRole: string
    matchScore?: number
  }
  project?: {
    id: string
    title: string
    clientName: string
  }
  createdAt: string
}

interface Project {
  id: string
  title: string
  clientName: string
  status: string
  candidateCount: number
  newMatches: number
  createdAt: string
}

interface Candidate {
  id: string
  fullName: string
  currentRole: string
  matchScore: number
  status: string
  lastContact: string
  project?: {
    id: string
    title: string
  }
}

export default function RecruiterWorkspace() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [actionQueue, setActionQueue] = useState<ActionQueueItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== UserRole.RECRUITER) {
      router.push("/auth/signin")
      return
    }

    fetchWorkspaceData()
  }, [session, status, router])

  const fetchWorkspaceData = async () => {
    try {
      // Fetch action queue
      const queueResponse = await fetch("/api/recruiter/action-queue")
      if (queueResponse.ok) {
        const queueData = await queueResponse.json()
        setActionQueue(queueData)
      }

      // Fetch projects
      const projectsResponse = await fetch("/api/recruiter/projects")
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
      }

      // Fetch recent candidates
      const candidatesResponse = await fetch("/api/recruiter/candidates/recent")
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json()
        setRecentCandidates(candidatesData)
      }
    } catch (error) {
      console.error("Error fetching workspace data:", error)
      toast.error("Failed to load workspace data")
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive"
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "default"
      case "LOW":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "default"
      case "PENDING":
        return "secondary"
      case "SKIPPED":
        return "outline"
      default:
        return "outline"
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "NEW_MATCHES":
        return <Target className="h-4 w-4" />
      case "CHAT_FOLLOW_UP":
        return <MessageSquare className="h-4 w-4" />
      case "NO_RESPONSE":
        return <Clock className="h-4 w-4" />
      case "PARSE_FAILURE":
        return <AlertTriangle className="h-4 w-4" />
      case "CHAT_INTERVENTION":
        return <Zap className="h-4 w-4" />
      case "MANUAL_REVIEW":
        return <Users className="h-4 w-4" />
      default:
        return <Briefcase className="h-4 w-4" />
    }
  }

  const handleActionClick = async (actionId: string, action: string) => {
    try {
      // Update action status
      await fetch(`/api/recruiter/action-queue/${actionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      })

      // Navigate based on action type
      switch (action) {
        case "NEW_MATCHES":
        case "CHAT_FOLLOW_UP":
        case "NO_RESPONSE":
          if (actionQueue.find(a => a.id === actionId)?.candidate) {
            router.push(`/recruiter/candidates/${actionQueue.find(a => a.id === actionId)?.candidate?.id}`)
          }
          break
        case "PARSE_FAILURE":
          router.push("/candidate/resume-parser")
          break
        case "CHAT_INTERVENTION":
          router.push("/chat")
          break
        default:
          // Refresh data
          fetchWorkspaceData()
      }
    } catch (error) {
      console.error("Error handling action:", error)
      toast.error("Failed to process action")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
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
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Recruiter Workspace</h1>
              <Badge variant="secondary">Action Hub</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => router.push("/recruiter/projects/create")}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button onClick={() => router.push("/chat")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {actionQueue.filter(a => a.status === "PENDING").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Matches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {actionQueue.filter(a => a.type === "NEW_MATCHES").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === "WIP").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recentCandidates.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Action Queue */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Action Queue
                    </CardTitle>
                    <CardDescription>
                      Tasks requiring your attention
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : actionQueue.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-600">No actions requiring your attention at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actionQueue.map((action) => (
                      <Card 
                        key={action.id} 
                        className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                          action.status === "URGENT" ? "border-l-4 border-red-500" : ""
                        }`}
                        onClick={() => handleActionClick(action.id, action.type)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getActionIcon(action.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{action.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                              
                              {action.candidate && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                  <div className="font-medium">{action.candidate.fullName}</div>
                                  <div className="text-gray-600">{action.candidate.currentRole}</div>
                                  {action.candidate.matchScore && (
                                    <div className="text-blue-600 font-medium">
                                      {action.candidate.matchScore}% match
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {action.project && (
                                <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
                                  <div className="font-medium">{action.project.title}</div>
                                  <div className="text-gray-600">{action.project.clientName}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                            <Badge variant={getStatusColor(action.status)}>
                              {action.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Created {formatDate(action.createdAt)}</span>
                          {action.dueDate && (
                            <span>Due {new Date(action.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.filter(p => p.status === "WIP").length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No active projects</p>
                ) : (
                  <div className="space-y-3">
                    {projects
                      .filter(p => p.status === "WIP")
                      .slice(0, 5)
                      .map((project) => (
                        <div key={project.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{project.title}</h4>
                              <p className="text-xs text-gray-600">{project.clientName}</p>
                            </div>
                            <Badge variant="outline">{project.status}</Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{project.candidateCount} candidates</span>
                            {project.newMatches > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {project.newMatches} new
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push("/recruiter/projects")}
                >
                  View All Projects
                </Button>
              </CardContent>
            </Card>

            {/* Recent Candidates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Recent Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentCandidates.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent candidates</p>
                ) : (
                  <div className="space-y-3">
                    {recentCandidates.slice(0, 5).map((candidate) => (
                      <div key={candidate.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{candidate.fullName}</h4>
                            <p className="text-xs text-gray-600">{candidate.currentRole}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-600">
                              {candidate.matchScore}%
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {candidate.status}
                            </Badge>
                          </div>
                        </div>
                        {candidate.project && (
                          <div className="text-xs text-gray-500">
                            {candidate.project.title}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Contacted {formatDate(candidate.lastContact)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push("/recruiter/candidates")}
                >
                  View All Candidates
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/recruiter/jobs/create")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/chat")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/admin/ai-providers")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  AI Providers
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}