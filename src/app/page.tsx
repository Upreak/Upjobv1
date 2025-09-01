"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Briefcase, 
  Search, 
  MessageSquare, 
  Bot, 
  BarChart3, 
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  Building2,
  UserCheck
} from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"candidates" | "recruiters">("candidates")

  const features = {
    candidates: [
      {
        icon: Search,
        title: "AI-Powered Job Search",
        description: "Find the perfect job with our intelligent matching algorithm that learns from your preferences."
      },
      {
        icon: Bot,
        title: "AI Resume Parser",
        description: "Upload your resume and let our AI extract and optimize your profile automatically."
      },
      {
        icon: MessageSquare,
        title: "24/7 AI Assistant",
        description: "Get instant help with applications, interview prep, and career guidance from our AI co-pilot."
      },
      {
        icon: BarChart3,
        title: "Application Tracking",
        description: "Track all your applications in one place with real-time status updates."
      }
    ],
    recruiters: [
      {
        icon: Users,
        title: "Smart Candidate Matching",
        description: "Find the best candidates instantly with AI-powered matching and scoring."
      },
      {
        icon: Briefcase,
        title: "Project Management",
        description: "Manage multiple job openings, track candidates, and collaborate with your team."
      },
      {
        icon: MessageSquare,
        title: "AI Co-Pilot",
        description: "Automate candidate engagement with our AI chatbot that handles 70-80% of communications."
      },
      {
        icon: Shield,
        title: "Action Queue",
        description: "Focus on what matters with our intelligent task prioritization system."
      }
    ]
  }

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp",
      content: "UpJob has revolutionized our recruitment process. The AI co-pilot handles initial screenings, saving us countless hours.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Software Engineer",
      company: "StartupXYZ",
      content: "Found my dream job in just 2 weeks! The AI matching was incredibly accurate and the application process was seamless.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Recruitment Manager",
      company: "GlobalCorp",
      content: "The action queue feature is a game-changer. Our team can focus on high-value activities while AI handles the rest.",
      rating: 5
    }
  ]

  const handleGetStarted = () => {
    if (session) {
      router.push("/dashboard")
    } else {
      router.push("/auth/signup")
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">UpJob</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link href="#features" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    Features
                  </Link>
                  <Link href="#how-it-works" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    How it Works
                  </Link>
                  <Link href="#testimonials" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    Testimonials
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {status === "loading" ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              ) : session ? (
                <>
                  <span className="text-sm text-gray-700">Welcome, {session.user.name}</span>
                  <Button onClick={() => router.push("/dashboard")}>Dashboard</Button>
                  <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => signIn()}>Sign In</Button>
                  <Button onClick={handleGetStarted}>Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              🚀 AI-Powered Recruitment Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your{" "}
              <span className="text-indigo-600">Hiring Process</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              UpJob combines AI-powered candidate matching, intelligent automation, and human oversight 
              to create the perfect recruitment experience for both companies and job seekers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-3">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">70-80%</div>
              <div className="text-gray-600">Automation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">50%</div>
              <div className="text-gray-600">Faster Hiring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">24/7</div>
              <div className="text-gray-600">AI Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Everyone
            </h2>
            <p className="text-xl text-gray-600">
              Whether you're looking for talent or seeking your next opportunity, UpJob has you covered.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("candidates")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "candidates"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <UserCheck className="inline-block w-4 h-4 mr-2" />
                For Candidates
              </button>
              <button
                onClick={() => setActiveTab("recruiters")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "recruiters"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 className="inline-block w-4 h-4 mr-2" />
                For Recruiters
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features[activeTab].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How UpJob Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, intelligent, and effective recruitment process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Profile",
                description: "Sign up and create your profile. Upload your resume or post your first job opening.",
                color: "bg-indigo-500"
              },
              {
                step: "2", 
                title: "AI Matching",
                description: "Our AI analyzes profiles and job requirements to find the perfect matches.",
                color: "bg-purple-500"
              },
              {
                step: "3",
                title: "Connect & Hire",
                description: "Engage with AI assistance, interview, and make the perfect hire or get hired.",
                color: "bg-pink-500"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${step.color} text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4`}>
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our users have to say about their experience with UpJob.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of companies and candidates who are already using UpJob to make better connections.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={handleGetStarted}
            className="text-lg px-8 py-3"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-4">UpJob</h3>
              <p className="text-gray-400">
                AI-powered recruitment platform for the modern workforce.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white">How it Works</Link></li>
                <li><Link href="#testimonials" className="hover:text-white">Testimonials</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 UpJob. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}