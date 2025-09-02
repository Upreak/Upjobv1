"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Home, 
  User, 
  Briefcase, 
  Search, 
  MessageSquare, 
  Settings,
  LogOut,
  Bell,
  BarChart3,
  Menu,
  Plus,
  Users,
  FileText,
  Building,
  Star
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navigation = {
  SUPER_ADMIN: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Users", href: "/dashboard/admin/users", icon: Users },
    { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
    { name: "Providers", href: "/dashboard/admin/providers", icon: Settings },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  ADMIN: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Job Postings", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Candidates", href: "/dashboard/candidates", icon: User },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  RECRUITER: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Workspace", href: "/dashboard/recruiter", icon: Building },
    { name: "Projects", href: "/dashboard/recruiter/projects", icon: Briefcase },
    { name: "Create Project", href: "/dashboard/recruiter/projects/create", icon: Plus },
    { name: "Candidates", href: "/dashboard/recruiter/candidates", icon: User },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  JOBSEEKER: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Profile", href: "/dashboard/candidate/profile", icon: User },
    { name: "Search Jobs", href: "/jobs", icon: Search },
    { name: "My Applications", href: "/dashboard/candidate/applications", icon: FileText },
    { name: "Saved Jobs", href: "/dashboard/candidate/saved", icon: Star },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userNavigation = navigation[session.user.role] || []
  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-red-100 text-red-800"
      case "ADMIN": return "bg-blue-100 text-blue-800"
      case "RECRUITER": return "bg-green-100 text-green-800"
      case "JOBSEEKER": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      "flex flex-col h-full bg-gray-900",
      mobile ? "w-64" : "hidden lg:flex lg:w-64 lg:flex-shrink-0"
    )}>
      <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-white text-xl font-bold">UpJob</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {userNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-indigo-700 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
                )}
                onClick={() => mobile && setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300",
                    "mr-3 flex-shrink-0 h-6 w-6"
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">{session.user.name}</p>
            <Badge className={getRoleColor(session.user.role)}>
              {session.user.role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="ml-3 text-gray-400 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Static sidebar for desktop */}
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-lg font-semibold text-gray-900">
                  {userNavigation.find(item => pathname === item.href)?.name || "Dashboard"}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="hidden lg:flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {session.user.name}
                </span>
                <Badge className={getRoleColor(session.user.role)}>
                  {session.user.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="hidden lg:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}