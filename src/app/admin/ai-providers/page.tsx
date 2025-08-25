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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  ArrowLeft,
  Zap,
  Database,
  Search,
  Brain,
  Activity,
  DollarSign,
  Clock
} from "lucide-react"
import { UserRole, ProviderType } from "@prisma/client"
import { toast } from "sonner"

interface AIProvider {
  id: string
  name: string
  type: ProviderType
  endpoint: string
  apiKey?: string
  model?: string
  isActive: boolean
  config?: string
  weight: number
  maxTokens?: number
  maxRequests?: number
  maxCost?: number
  requestsPerMinute?: number
  tokensPerMinute?: number
  createdAt: string
  updatedAt: string
  providerMetrics?: {
    requestCount: number
    tokenCount: number
    successCount: number
    failureCount: number
    avgLatency?: number
    totalCost: number
  }
}

interface ProviderFormData {
  name: string
  type: ProviderType
  endpoint: string
  apiKey: string
  model: string
  isActive: boolean
  config: string
  weight: number
  maxTokens: number
  maxRequests: number
  maxCost: number
  requestsPerMinute: number
  tokensPerMinute: number
}

const providerTypes = [
  { value: ProviderType.LLM, label: "Large Language Model" },
  { value: ProviderType.SERP, label: "Search Engine" },
  { value: ProviderType.PARSING, label: "Document Parsing" },
  { value: ProviderType.EMBEDDING, label: "Embedding Generation" }
]

export default function AIProvidersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [formData, setFormData] = useState<ProviderFormData>({
    name: "",
    type: ProviderType.LLM,
    endpoint: "",
    apiKey: "",
    model: "",
    isActive: true,
    config: "",
    weight: 1.0,
    maxTokens: 1000,
    maxRequests: 100,
    maxCost: 100,
    requestsPerMinute: 60,
    tokensPerMinute: 10000
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      router.push("/auth/signin")
      return
    }

    fetchProviders()
  }, [session, status, router])

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/admin/ai-providers")
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      } else {
        toast.error("Failed to fetch AI providers")
      }
    } catch (error) {
      console.error("Error fetching AI providers:", error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProviderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingProvider 
        ? `/api/admin/ai-providers/${editingProvider.id}`
        : "/api/admin/ai-providers"
      
      const method = editingProvider ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingProvider ? "Provider updated successfully" : "Provider created successfully")
        resetForm()
        fetchProviders()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to save provider")
      }
    } catch (error) {
      console.error("Error saving provider:", error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      type: provider.type,
      endpoint: provider.endpoint,
      apiKey: provider.apiKey || "",
      model: provider.model || "",
      isActive: provider.isActive,
      config: provider.config || "",
      weight: provider.weight,
      maxTokens: provider.maxTokens || 1000,
      maxRequests: provider.maxRequests || 100,
      maxCost: provider.maxCost || 100,
      requestsPerMinute: provider.requestsPerMinute || 60,
      tokensPerMinute: provider.tokensPerMinute || 10000
    })
    setIsEditing(true)
  }

  const handleDelete = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/ai-providers/${providerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Provider deleted successfully")
        fetchProviders()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete provider")
      }
    } catch (error) {
      console.error("Error deleting provider:", error)
      toast.error("An error occurred")
    }
  }

  const toggleProviderStatus = async (providerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/ai-providers/${providerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast.success(`Provider ${isActive ? "activated" : "deactivated"} successfully`)
        fetchProviders()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update provider status")
      }
    } catch (error) {
      console.error("Error toggling provider status:", error)
      toast.error("An error occurred")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: ProviderType.LLM,
      endpoint: "",
      apiKey: "",
      model: "",
      isActive: true,
      config: "",
      weight: 1.0,
      maxTokens: 1000,
      maxRequests: 100,
      maxCost: 100,
      requestsPerMinute: 60,
      tokensPerMinute: 10000
    })
    setEditingProvider(null)
    setIsEditing(false)
  }

  const getTypeIcon = (type: ProviderType) => {
    switch (type) {
      case ProviderType.LLM:
        return <Brain className="h-4 w-4" />
      case ProviderType.SERP:
        return <Search className="h-4 w-4" />
      case ProviderType.PARSING:
        return <Database className="h-4 w-4" />
      case ProviderType.EMBEDDING:
        return <Activity className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getSuccessRate = (metrics?: AIProvider['providerMetrics']) => {
    if (!metrics || metrics.requestCount === 0) return 0
    return Math.round((metrics.successCount / metrics.requestCount) * 100)
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
              <h1 className="text-2xl font-bold text-gray-900">AI Provider Management</h1>
              <Badge variant="secondary">Admin</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Provider Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  {isEditing ? "Edit Provider" : "Add New Provider"}
                </CardTitle>
                <CardDescription>
                  Configure AI service providers for the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Provider Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., OpenAI GPT-4"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Provider Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value as ProviderType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {providerTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="endpoint">API Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={formData.endpoint}
                      onChange={(e) => handleInputChange("endpoint", e.target.value)}
                      placeholder="https://api.example.com/v1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => handleInputChange("apiKey", e.target.value)}
                      placeholder="Enter API key"
                    />
                  </div>

                  <div>
                    <Label htmlFor="model">Default Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                      placeholder="e.g., gpt-4, claude-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", parseFloat(e.target.value))}
                        min="0"
                        max="10"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={formData.maxTokens}
                        onChange={(e) => handleInputChange("maxTokens", parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxRequests">Max Requests</Label>
                      <Input
                        id="maxRequests"
                        type="number"
                        value={formData.maxRequests}
                        onChange={(e) => handleInputChange("maxRequests", parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxCost">Max Cost ($)</Label>
                      <Input
                        id="maxCost"
                        type="number"
                        step="0.01"
                        value={formData.maxCost}
                        onChange={(e) => handleInputChange("maxCost", parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="requestsPerMinute">Requests/Minute</Label>
                      <Input
                        id="requestsPerMinute"
                        type="number"
                        value={formData.requestsPerMinute}
                        onChange={(e) => handleInputChange("requestsPerMinute", parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="config">Configuration (JSON)</Label>
                    <Textarea
                      id="config"
                      value={formData.config}
                      onChange={(e) => handleInputChange("config", e.target.value)}
                      placeholder="Additional configuration in JSON format"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? "Saving..." : (isEditing ? "Update" : "Create")}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Providers List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Providers</CardTitle>
                <CardDescription>
                  Manage and monitor AI service providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : providers.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Providers Configured</h3>
                    <p className="text-gray-600 mb-4">Add your first AI provider to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {providers.map((provider) => (
                      <Card key={provider.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {getTypeIcon(provider.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{provider.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">{provider.type}</Badge>
                                <Badge variant={provider.isActive ? "default" : "secondary"}>
                                  {provider.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={provider.isActive}
                              onCheckedChange={(checked) => toggleProviderStatus(provider.id, checked)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(provider)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(provider.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Weight</p>
                            <p className="font-medium">{provider.weight}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Model</p>
                            <p className="font-medium">{provider.model || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Max Tokens</p>
                            <p className="font-medium">{provider.maxTokens || "Unlimited"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Max Cost</p>
                            <p className="font-medium">${provider.maxCost || "Unlimited"}</p>
                          </div>
                        </div>

                        {provider.providerMetrics && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium mb-2">Performance Metrics</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Requests</p>
                                <p className="font-medium">{provider.providerMetrics.requestCount}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Success Rate</p>
                                <p className="font-medium">{getSuccessRate(provider.providerMetrics)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Tokens Used</p>
                                <p className="font-medium">{provider.providerMetrics.tokenCount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Avg Latency</p>
                                <p className="font-medium">{provider.providerMetrics.avgLatency?.toFixed(0) || "N/A"}ms</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total Cost</p>
                                <p className="font-medium">${provider.providerMetrics.totalCost.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}