import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/types/enums"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const candidate = await db.candidate.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        locations: {
          include: {
            location: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json({ message: "Candidate profile not found" }, { status: 404 })
    }

    // Transform the data to match the frontend interface
    const profile = {
      ...candidate,
      languages: candidate.languages ? JSON.parse(candidate.languages) : [],
      skills: candidate.skills?.map(s => s.skill.name) || [],
      certifications: candidate.certifications ? JSON.parse(candidate.certifications) : [],
      education: candidate.education ? JSON.parse(candidate.education) : [],
      workHistory: candidate.workHistory ? JSON.parse(candidate.workHistory) : [],
      preferredLocations: candidate.locations?.map(l => l.location.name) || [],
      preferredIndustries: candidate.preferredIndustries ? JSON.parse(candidate.preferredIndustries) : [],
      hobbies: candidate.hobbies ? JSON.parse(candidate.hobbies) : [],
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching candidate profile:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    // Calculate profile completeness
    const completenessFields = [
      data.fullName,
      data.phone,
      data.currentRole,
      data.expectedRole,
      data.skills?.length,
      data.preferredLocations?.length,
      data.totalExperience,
      data.currentCTC,
      data.expectedCTC
    ]
    
    const completedFields = completenessFields.filter(field => field && (Array.isArray(field) ? field.length > 0 : true)).length
    const profileCompleteness = Math.round((completedFields / completenessFields.length) * 100)

    // Update candidate profile
    const updatedCandidate = await db.candidate.update({
      where: { userId: session.user.id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        languages: data.languages ? JSON.stringify(data.languages) : null,
        totalExperience: data.totalExperience,
        currentRole: data.currentRole,
        expectedRole: data.expectedRole,
        currentCTC: data.currentCTC,
        expectedCTC: data.expectedCTC,
        noticePeriod: data.noticePeriod,
        skills: data.skills ? JSON.stringify(data.skills) : null,
        certifications: data.certifications ? JSON.stringify(data.certifications) : null,
        education: data.education ? JSON.stringify(data.education) : null,
        workHistory: data.workHistory ? JSON.stringify(data.workHistory) : null,
        preferredLocations: data.preferredLocations ? JSON.stringify(data.preferredLocations) : null,
        preferredIndustries: data.preferredIndustries ? JSON.stringify(data.preferredIndustries) : null,
        jobType: data.jobType,
        workType: data.workType,
        readyToRelocate: data.readyToRelocate,
        lookingAbroad: data.lookingAbroad,
        sectorType: data.sectorType,
        reservationCategory: data.reservationCategory,
        hobbies: data.hobbies ? JSON.stringify(data.hobbies) : null,
        bio: data.bio,
        hasCurrentOffers: data.hasCurrentOffers,
        bestTimeToContact: data.bestTimeToContact,
        preferredContact: data.preferredContact,
        profileCompleteness: profileCompleteness,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        }
      }
    })

    // Transform the data to match the frontend interface
    const profile = {
      ...updatedCandidate,
      languages: updatedCandidate.languages ? JSON.parse(updatedCandidate.languages) : [],
      skills: updatedCandidate.skills ? JSON.parse(updatedCandidate.skills) : [],
      certifications: updatedCandidate.certifications ? JSON.parse(updatedCandidate.certifications) : [],
      education: updatedCandidate.education ? JSON.parse(updatedCandidate.education) : [],
      workHistory: updatedCandidate.workHistory ? JSON.parse(updatedCandidate.workHistory) : [],
      preferredLocations: updatedCandidate.preferredLocations ? JSON.parse(updatedCandidate.preferredLocations) : [],
      preferredIndustries: updatedCandidate.preferredIndustries ? JSON.parse(updatedCandidate.preferredIndustries) : [],
      hobbies: updatedCandidate.hobbies ? JSON.parse(updatedCandidate.hobbies) : [],
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error updating candidate profile:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}