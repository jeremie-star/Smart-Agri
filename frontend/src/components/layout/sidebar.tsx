"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Sprout,
  Droplets,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/services/auth.service"
import type { Farmer } from "@/types/api"
import toast from "react-hot-toast"

interface SidebarProps {
  className?: string
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Farms",
    href: "/farms",
    icon: Sprout,
  },
  {
    title: "Irrigation",
    href: "/irrigation",
    icon: Droplets,
  },
  {
    title: "AI Assistant",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [user, setUser] = React.useState<Farmer | null>(null)

  // Fetch user once on mount, with caching
  React.useEffect(() => {
    const cachedUser = localStorage.getItem("user_profile")
    if (cachedUser) {
      setUser(JSON.parse(cachedUser))
    } else if (authService.isAuthenticated()) {
      authService.getProfile()
        .then((profile) => {
          setUser(profile)
          localStorage.setItem("user_profile", JSON.stringify(profile))
        })
        .catch(() => {
          // Silently fail, keep user as null
        })
    }
  }, [])

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle logout
  const handleLogout = () => {
    authService.logout()
    localStorage.removeItem("user_profile")
    setUser(null)
    toast.success("Logged out successfully")
    router.push("/login")
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo & Toggle */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Droplets className="h-6 w-6 text-green-600" />
              <span className="text-lg font-bold">Smart Agri</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(isCollapsed && "mx-auto")}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                    isCollapsed && "justify-center"
                  )}
                >
                  <Icon size={20} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.title}</span>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          {user ? (
            <>
              <div className={cn("flex items-center", isCollapsed && "justify-center")}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-green-600 text-white">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={user.name}>
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.language_preference}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              )}
            </>
          ) : (
            <div className={cn("flex items-center", isCollapsed && "justify-center")}>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted">?</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">Guest</p>
                  <p className="text-xs text-muted-foreground">Not logged in</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
