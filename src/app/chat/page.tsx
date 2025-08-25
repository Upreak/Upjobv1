"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User,
  ArrowLeft,
  Sparkles,
  Briefcase,
  Search,
  FileText,
  Settings
} from "lucide-react"
import { UserRole, ChatSessionType, ChatPlatform } from "@prisma/client"
import { toast } from "sonner"

interface ChatMessage {
  id: string
  messageType: "USER" | "BOT" | "SYSTEM"
  content: string
  createdAt: string
  metadata?: any
}

interface ChatSession {
  id: string
  sessionType: ChatSessionType
  platform: ChatPlatform
  status: string
  context?: any
  messages: ChatMessage[]
}

const sessionTypes = [
  { value: ChatSessionType.CANDIDATE_REGISTRATION, label: "Profile Setup", icon: User, description: "Help with profile creation and setup" },
  { value: ChatSessionType.JOB_SEARCH, label: "Job Search", icon: Search, description: "Find and apply for jobs" },
  { value: ChatSessionType.APPLICATION, label: "Applications", icon: FileText, description: "Track and manage applications" },
  { value: ChatSessionType.HR_POSTING, label: "Job Posting", icon: Briefcase, description: "Create and manage job postings" },
  { value: ChatSessionType.CANDIDATE_SEARCH, label: "Candidate Search", icon: Search, description: "Find and evaluate candidates" },
  { value: ChatSessionType.GENERAL, label: "General Help", icon: Settings, description: "General assistance and support" }
]

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedSessionType, setSelectedSessionType] = useState<ChatSessionType>(ChatSessionType.GENERAL)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Load recent chat session
    loadRecentSession()
  }, [session, status, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadRecentSession = async () => {
    try {
      const response = await fetch(`/api/chat?sessionType=${selectedSessionType}`)
      if (response.ok) {
        const sessions = await response.json()
        if (sessions.length > 0) {
          setCurrentSession(sessions[0])
          setMessages(sessions[0].messages)
        }
      }
    } catch (error) {
      console.error("Error loading chat session:", error)
    }
  }

  const handleSessionTypeChange = async (type: ChatSessionType) => {
    setSelectedSessionType(type)
    setMessages([])
    setCurrentSession(null)
    
    // Load session for new type
    try {
      const response = await fetch(`/api/chat?sessionType=${type}`)
      if (response.ok) {
        const sessions = await response.json()
        if (sessions.length > 0) {
          setCurrentSession(sessions[0])
          setMessages(sessions[0].messages)
        }
      }
    } catch (error) {
      console.error("Error loading chat session:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      messageType: "USER",
      content: inputMessage,
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionType: selectedSessionType,
          platform: ChatPlatform.WEB
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          messageType: "BOT",
          content: data.response,
          createdAt: new Date().toISOString(),
          metadata: data.context
        }

        setMessages(prev => [...prev, botMessage])
        
        if (!currentSession) {
          // Load the created session
          loadRecentSession()
        }
      } else {
        toast.error(data.message || "Failed to get response")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getSessionTypeInfo = (type: ChatSessionType) => {
    return sessionTypes.find(t => t.value === type)
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
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <Badge variant="secondary">
                <Sparkles className="h-3 w-3 mr-1" />
                Beta
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Session Type Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat Topics
                </CardTitle>
                <CardDescription>
                  Choose what you'd like help with
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessionTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = selectedSessionType === type.value
                  const isAvailable = session.user.role === UserRole.CANDIDATE || 
                                   type.value === ChatSessionType.GENERAL ||
                                   type.value === ChatSessionType.HR_POSTING ||
                                   type.value === ChatSessionType.CANDIDATE_SEARCH

                  return (
                    <button
                      key={type.value}
                      onClick={() => isAvailable && handleSessionTypeChange(type.value)}
                      disabled={!isAvailable}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : isAvailable
                          ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {session.user.role === UserRole.CANDIDATE && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push("/candidate/resume-parser")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Parse Resume
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push("/jobs")}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Browse Jobs
                    </Button>
                  </>
                )}
                {session.user.role === UserRole.RECRUITER && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push("/recruiter/jobs/create")}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Post Job
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push("/admin/ai-providers")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage AI
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Bot className="h-5 w-5 mr-2" />
                      AI Assistant
                    </CardTitle>
                    {currentSession && (
                      <CardDescription className="mt-1">
                        {getSessionTypeInfo(currentSession.sessionType)?.label}
                      </CardDescription>
                    )}
                  </div>
                  {currentSession && (
                    <Badge variant="outline">
                      {currentSession.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Welcome to AI Assistant
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {getSessionTypeInfo(selectedSessionType)?.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        Type a message below to get started
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.messageType === "USER" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.messageType === "USER"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              message.messageType === "USER" ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={isLoading || !inputMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Capabilities */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">What I Can Help With</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session.user.role === UserRole.CANDIDATE && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Profile Setup</h4>
                        <p className="text-xs text-gray-600">Complete your profile, parse resume, improve your chances</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Job Search</h4>
                        <p className="text-xs text-gray-600">Find relevant jobs, get application tips, prepare for interviews</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Career Advice</h4>
                        <p className="text-xs text-gray-600">Salary negotiation, career growth, skill development</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Application Help</h4>
                        <p className="text-xs text-gray-600">Track applications, follow up, improve your applications</p>
                      </div>
                    </>
                  )}
                  {session.user.role === UserRole.RECRUITER && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Job Posting</h4>
                        <p className="text-xs text-gray-600">Create effective job descriptions, set requirements</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Candidate Search</h4>
                        <p className="text-xs text-gray-600">Find suitable candidates, evaluate profiles</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Interview Process</h4>
                        <p className="text-xs text-gray-600">Screen candidates, conduct interviews, make decisions</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Recruitment Strategy</h4>
                        <p className="text-xs text-gray-600">Optimize hiring process, improve candidate experience</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}