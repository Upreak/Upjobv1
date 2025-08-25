import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, ProviderType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const providers = await db.aIProvider.findMany({
      include: {
        providerMetrics: {
          orderBy: {
            date: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const transformedProviders = providers.map(provider => ({
      ...provider,
      config: provider.config ? JSON.parse(provider.config) : {},
      providerMetrics: provider.providerMetrics[0] || null
    }))

    return NextResponse.json(transformedProviders)
  } catch (error) {
    console.error("Error fetching AI providers:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.type || !data.endpoint) {
      return NextResponse.json({ 
        message: "Name, type, and endpoint are required" 
      }, { status: 400 })
    }

    // Check if provider with same name already exists
    const existingProvider = await db.aIProvider.findUnique({
      where: { name: data.name }
    })

    if (existingProvider) {
      return NextResponse.json({ 
        message: "Provider with this name already exists" 
      }, { status: 400 })
    }

    const provider = await db.aIProvider.create({
      data: {
        name: data.name,
        type: data.type as ProviderType,
        endpoint: data.endpoint,
        apiKey: data.apiKey,
        model: data.model,
        isActive: data.isActive ?? true,
        config: data.config ? JSON.stringify(data.config) : null,
        weight: data.weight || 1.0,
        maxTokens: data.maxTokens,
        maxRequests: data.maxRequests,
        maxCost: data.maxCost,
        requestsPerMinute: data.requestsPerMinute,
        tokensPerMinute: data.tokensPerMinute
      }
    })

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    console.error("Error creating AI provider:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}