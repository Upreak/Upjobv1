import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { hashPassword, generatePassword } from "@/lib/auth"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status: "ACTIVE",
      }
    })

    // Create role-specific profile
    if (role === UserRole.CANDIDATE) {
      await db.candidate.create({
        data: {
          userId: user.id,
          profileCompleteness: 0,
        }
      })
    } else if (role === UserRole.RECRUITER) {
      await db.recruiter.create({
        data: {
          userId: user.id,
        }
      })
    } else if (role === UserRole.ADMIN) {
      await db.admin.create({
        data: {
          userId: user.id,
          permissions: JSON.stringify([]),
        }
      })
    }

    // Create default workspace for non-super-admin users
    if (role !== UserRole.SUPER_ADMIN) {
      const workspace = await db.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          settings: JSON.stringify({}),
        }
      })

      // Update user with workspace
      await db.user.update({
        where: { id: user.id },
        data: { workspaceId: workspace.id }
      })
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}