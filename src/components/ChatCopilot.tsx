"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from "lucide-react"

interface ChatMessage {
  id: string
  role: "CANDIDATE" | "RECRUITER" | "BOT"
  message: string
  timestamp: Date
  status?: "sent" | "delivered" | "read"
  metadata?: any
}

interface ChatCopilotProps {
  candidateId: string
  projectId: string
  candidateName: string
  projectName: string
  nonNegotiableCriteria: string[]
  onIntervention?: (intervening: boolean) => void
}

export default function ChatCopilot({
  candidateId,
  projectId,
  candidateName,
  projectName,
  nonNegotiableCriteria,
  onIntervention
}: ChatCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isIntervening, setIsIntervening] = useState(false)
  const [chatStatus, setChatStatus] = useState<"ACTIVE" | "COMPLETED" | "INTERVENTION_NEEDED">("ACTIVE")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadChatHistory()
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history?candidateId=${candidateId}&projectId=${projectId}`)
      if (response.ok) {
        const history = await response.json()
        setMessages(history.messages || [])
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  const sendMessage = async (message: string, role: "RECRUITER" | "BOT" = "RECRUITER") => {
    if (!message.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      message: message.trim(),
      timestamp: new Date(),
      status: "sent"
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      if (role === "RECRUITER") {
        // Send recruiter message
        await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            projectId,
            message: message.trim(),
            role: "RECRUITER"
          })
        })
      }

      // If it's a recruiter message or the bot needs to respond, get AI response
      if (role === "RECRUITER" || (role === "BOT" && messages.length === 0)) {
        setIsTyping(true)
        
        // Get AI response
        const aiResponse = await getAIResponse(message.trim(), role)
        
        if (aiResponse) {
          const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "BOT",
            message: aiResponse.message,
            timestamp: new Date(),
            metadata: aiResponse.metadata
          }

          setMessages(prev => [...prev, botMessage])
          
          // Check if intervention is needed
          if (aiResponse.metadata?.interventionNeeded) {
            setChatStatus("INTERVENTION_NEEDED")
            onIntervention?.(true)
          }

          // Send bot message to server
          await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateId,
              projectId,
              message: aiResponse.message,
              role: "BOT",
              metadata: aiResponse.metadata
            })
          })
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const getAIResponse = async (message: string, senderRole: string) => {
    try {
      const response = await fetch("/api/chat/ai-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          projectId,
          message,
          senderRole,
          chatHistory: messages.slice(-10), // Send last 10 messages for context
          nonNegotiableCriteria
        })
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error("Error getting AI response:", error)
    }

    // Fallback response
    return {
      message: "I understand. Let me help you with that. Could you please provide more details?",
      metadata: { interventionNeeded: false }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (isIntervening) {
        sendMessage(inputMessage, "RECRUITER")
      }
    }
  }

  const handleIntervention = () => {
    setIsIntervening(!isIntervening)
    onIntervention?.(isIntervening)
    if (isIntervening) {
      setChatStatus("ACTIVE")
    } else {
      setChatStatus("INTERVENTION_NEEDED")
    }
    inputRef.current?.focus()
  }

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative") => {
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          feedback,
          candidateId,
          projectId
        })
      })
    } catch (error) {
      console.error("Error sending feedback:", error)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getMessageIcon = (role: string) => {
    switch (role) {
      case "BOT":
        return <Bot className="h-4 w-4 text-blue-500" />
      case "RECRUITER":
        return <User className="h-4 w-4 text-green-500" />
      case "CANDIDATE":
        return <User className="h-4 w-4 text-purple-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getMessageColor = (role: string) => {
    switch (role) {
      case "BOT":
        return "bg-blue-50 border-blue-200"
      case "RECRUITER":
        return "bg-green-50 border-green-200"
      case "CANDIDATE":
        return "bg-purple-50 border-purple-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Chat Co-Pilot
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={chatStatus === "INTERVENTION_NEEDED" ? "destructive" : "secondary"}>
              {chatStatus === "ACTIVE" && <Clock className="h-3 w-3 mr-1" />}
              {chatStatus === "INTERVENTION_NEEDED" && <AlertTriangle className="h-3 w-3 mr-1" />}
              {chatStatus === "COMPLETED" && <CheckCircle className="h-3 w-3 mr-1" />}
              {chatStatus.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {candidateName} • {projectName}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                {getMessageIcon(msg.role)}
                <div className={`flex-1 max-w-[70%] p-3 rounded-lg border ${getMessageColor(msg.role)}`}>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{msg.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.role === "BOT" && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(msg.id, "positive")}
                          className="h-6 w-6 p-0"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(msg.id, "negative")}
                          className="h-6 w-6 p-0"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-blue-500" />
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Non-negotiable Criteria */}
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="text-xs text-gray-600 mb-1">Non-negotiable criteria:</div>
          <div className="flex flex-wrap gap-1">
            {nonNegotiableCriteria.map((criteria, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {criteria}
              </Badge>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            {isIntervening ? (
              <>
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => sendMessage(inputMessage, "RECRUITER")}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleIntervention}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="AI is handling the conversation..."
                  disabled
                  className="flex-1"
                />
                <Button
                  onClick={handleIntervention}
                  variant="outline"
                >
                  Intervene
                </Button>
              </>
            )}
          </div>
          {isIntervening && (
            <p className="text-xs text-gray-500 mt-2">
              You are now controlling the conversation. Click "Resume Automation" to let AI take over.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}