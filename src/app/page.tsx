"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserRole } from "@/types/enums"
import { 
  Briefcase, 
  Users, 
  Settings, 
  Bot, 
  Search, 
  FileText, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react"

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const router = useRouter()

  const handleGetStarted = () => {
    if (selectedRole === UserRole.CANDIDATE) {
      router.push("/auth/signup?role=candidate")
    } else if (selectedRole === UserRole.RECRUITER) {
      router.push("/auth/signup?role=recruiter")
    } else if (selectedRole === UserRole.ADMIN) {
      router.push("/auth/signin")
    }
  }

  const features = [
    {
      title: "AI-Powered Job Matching",
      description: "Our intelligent co-pilot matches candidates with perfect job opportunities based on skills, experience, and preferences.",
      icon: Bot
    },
    {
      title: "Smart Resume Parsing",
      description: "Automatically parse and analyze resumes to extract key information and match with job requirements.",
      icon: FileText
    },
    {
      title: "Meta-Job Search",
      description: "Search across multiple job boards and company career pages from a single platform.",
      icon: Search
    },
    {
      title: "Advanced Analytics",
      description: "Get detailed insights and analytics on recruitment metrics and job market trends.",
      icon: TrendingUp
    }
  ]

  const roleCards = [
    {
      role: UserRole.CANDIDATE,
      title: "I'm a Candidate",
      description: "Find your dream job with AI-powered matching and personalized recommendations.",
      features: [
        "AI-powered job recommendations",
        "Resume parsing and optimization",
        "Application tracking",
        "Interview preparation"
      ],
      icon: Users,
      color: "bg-blue-50 border-blue-200"
    },
    {
      role: UserRole.RECRUITER,
      title: "I'm a Recruiter",
      description: "Streamline your hiring process with AI co-pilot and intelligent candidate matching.",
      features: [
        "Post jobs with AI assistance",
        "Smart candidate screening",
        "Automated communication",
        "Advanced analytics dashboard"
      ],
      icon: Briefcase,
      color: "bg-green-50 border-green-200"
    },
    {
      role: UserRole.ADMIN,
      title: "I'm an Administrator",
      description: "Manage the entire platform with comprehensive admin tools and controls.",
      features: [
        "User management",
        "Platform analytics",
        "Provider management",
        "System configuration"
      ],
      icon: Settings,
      color: "bg-purple-50 border-purple-200"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">JobBoard AI</h1>
              </div>
              <nav className="ml-10 flex space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push("/auth/signin")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Powered by AI Co-Pilot
            </Badge>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Revolutionize Your 
            <span className="text-blue-600"> Job Search</span> & 
            <span className="text-purple-600"> Recruitment</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the future of hiring with our AI-powered platform that intelligently matches candidates with perfect opportunities while streamlining the entire recruitment process.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={() => document.getElementById('role-selection')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/auth/signin")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Recruitment
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides everything you need for efficient and effective hiring.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section id="role-selection" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Path
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select how you'd like to use our platform and get started in minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {roleCards.map((card) => (
              <Card
                key={card.role}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedRole === card.role ? 'ring-2 ring-blue-500 shadow-lg' : ''
                } ${card.color}`}
                onClick={() => setSelectedRole(card.role)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <card.icon className="h-8 w-8 text-gray-700" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {card.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              disabled={!selectedRole}
              className="px-8"
            >
              Get Started as {selectedRole ? roleCards.find(c => c.role === selectedRole)?.title.split("I'm a ")[1] : 'Selected Role'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">JobBoard AI</h3>
              <p className="text-gray-400 text-sm">
                Revolutionizing recruitment with AI-powered matching and automation.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">For Candidates</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Search Jobs</a></li>
                <li><a href="#" className="hover:text-white">Career Resources</a></li>
                <li><a href="#" className="hover:text-white">Resume Builder</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">For Recruiters</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Post Jobs</a></li>
                <li><a href="#" className="hover:text-white">Search Candidates</a></li>
                <li><a href="#" className="hover:text-white">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 JobBoard AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}