"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Sprout,
  Droplets,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { authService } from "@/services/auth.service"
import type { Farmer } from "@/types/api"
import toast from "react-hot-toast"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Farmers",
    href: "/admin/farmers",
    icon: Users,
  },
  {
    title: "Farms",
    href: "/admin/farms",
    icon: Sprout,
  },
  {
    title: "Schedules",
    href: "/admin/schedules",
    icon: Droplets,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<Farmer | null>(null)

  React.useEffect(() => {
    const cachedUser = localStorage.getItem("user_profile")
    if (cachedUser) {
      setUser(JSON.parse(cachedUser))
    }
  }, [])

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    authService.logout()
    localStorage.removeItem("user_profile")
    setUser(null)
    toast.success("Logged out successfully")
    router.push("/login")
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo & Title */}
        <div className="flex h-16 items-center border-b px-6">
          <Shield className="h-6 w-6 text-primary mr-2" />
          <div>
            <span className="text-lg font-bold">Admin Panel</span>
            <p className="text-xs text-muted-foreground">Smart Agri</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
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
                      : "hover:bg-accent"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.title}</span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          {user && (
            <>
              <div className="flex items-center mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={user.name}>
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
