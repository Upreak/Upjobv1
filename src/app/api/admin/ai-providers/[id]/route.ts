import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/types/enums"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const provider = await db.aIProvider.findUnique({
      where: { id: params.id },
      include: {
        providerMetrics: {
          orderBy: {
            date: "desc"
          },
          take: 30 // Get last 30 days of metrics
        }
      }
    })

    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 })
    }

    const transformedProvider = {
      ...provider,
      config: provider.config ? JSON.parse(provider.config) : {},
      providerMetrics: provider.providerMetrics
    }

    return NextResponse.json(transformedProvider)
  } catch (error) {
    console.error("Error fetching AI provider:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    // Check if provider exists
    const existingProvider = await db.aIProvider.findUnique({
      where: { id: params.id }
    })

    if (!existingProvider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 })
    }

    // If updating name, check for conflicts
    if (data.name && data.name !== existingProvider.name) {
      const nameConflict = await db.aIProvider.findUnique({
        where: { name: data.name }
      })

      if (nameConflict) {
        return NextResponse.json({ 
          message: "Provider with this name already exists" 
        }, { status: 400 })
      }
    }

    const updatedProvider = await db.aIProvider.update({
      where: { id: params.id },
      data: {
        name: data.name,
        type: data.type,
        endpoint: data.endpoint,
        apiKey: data.apiKey,
        model: data.model,
        isActive: data.isActive,
        config: data.config ? JSON.stringify(data.config) : null,
        weight: data.weight,
        maxTokens: data.maxTokens,
        maxRequests: data.maxRequests,
        maxCost: data.maxCost,
        requestsPerMinute: data.requestsPerMinute,
        tokensPerMinute: data.tokensPerMinute
      }
    })

    return NextResponse.json(updatedProvider)
  } catch (error) {
    console.error("Error updating AI provider:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Check if provider exists
    const existingProvider = await db.aIProvider.findUnique({
      where: { id: params.id }
    })

    if (!existingProvider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 })
    }

    await db.aIProvider.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Provider deleted successfully" })
  } catch (error) {
    console.error("Error deleting AI provider:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}