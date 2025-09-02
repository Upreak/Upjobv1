"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, AlertTriangle } from "lucide-react"

interface ProfileData {
  summary?: string
  location?: string
  currentCtc?: number
  expectedCtc?: number
  noticePeriod?: number
  skills?: string[]
  experience?: any[]
  education?: any[]
  resumeUrl?: string
}

interface ProfileCompletenessProps {
  profile: ProfileData
}

export function ProfileCompleteness({ profile }: ProfileCompletenessProps) {
  const [completeness, setCompleteness] = useState(0)
  const [sections, setSections] = useState<any[]>([])

  useEffect(() => {
    const sections = [
      {
        name: "Basic Info",
        weight: 25,
        completed: !!(
          profile.summary && 
          profile.location && 
          profile.currentCtc && 
          profile.expectedCtc
        ),
        fields: ["Summary", "Location", "Current CTC", "Expected CTC"]
      },
      {
        name: "Skills",
        weight: 20,
        completed: !!(profile.skills && profile.skills.length > 0),
        fields: [`Skills (${profile.skills?.length || 0})`]
      },
      {
        name: "Experience",
        weight: 20,
        completed: !!(profile.experience && profile.experience.length > 0),
        fields: [`Experience entries (${profile.experience?.length || 0})`]
      },
      {
        name: "Education",
        weight: 15,
        completed: !!(profile.education && profile.education.length > 0),
        fields: [`Education entries (${profile.education?.length || 0})`]
      },
      {
        name: "Resume",
        weight: 20,
        completed: !!profile.resumeUrl,
        fields: ["Resume uploaded"]
      }
    ]

    const completedWeight = sections
      .filter(section => section.completed)
      .reduce((sum, section) => sum + section.weight, 0)

    setCompleteness(completedWeight)
    setSections(sections)
  }, [profile])

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getCompletenessBadge = (score: number) => {
    if (score >= 80) return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Excellent
      </Badge>
    )
    if (score >= 60) return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Good
      </Badge>
    )
    return (
      <Badge className="bg-red-100 text-red-800">
        <Circle className="w-3 h-3 mr-1" />
        Needs Work
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profile Completeness</span>
          {getCompletenessBadge(completeness)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Score</span>
            <span className={`font-bold ${getCompletenessColor(completeness)}`}>
              {completeness}%
            </span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center space-x-2">
                {section.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <div className="font-medium text-sm">{section.name}</div>
                  <div className="text-xs text-gray-500">
                    {section.fields.join(", ")}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {section.completed ? "Complete" : "Incomplete"}
              </div>
            </div>
          ))}
        </div>

        {completeness < 80 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Complete your profile to increase your chances of getting noticed by recruiters. 
              Profiles with 80%+ completeness get 3x more views!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}