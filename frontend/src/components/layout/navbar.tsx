"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, Menu, LogOut, User, Settings, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { authService } from "@/services/auth.service"
import { apiClient } from "@/services/api-client"
import type { Farmer } from "@/types/api"
import toast from "react-hot-toast"

interface NavbarProps {
  onMenuClick?: () => void
}

interface Notification {
  id: string
  message: string
  created_at: string
  status: string
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter()
  const [user, setUser] = React.useState<Farmer | null>(null)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  // Fetch user and notifications once on mount
  React.useEffect(() => {
    // Get cached user
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
          // Silently fail
        })
    }

    // Fetch notifications
    if (authService.isAuthenticated()) {
      apiClient.get<Notification[]>('/api/notifications/history?limit=5')
        .then((data) => {
          setNotifications(data)
          // Count unread notifications (status !== 'delivered')
          const unread = data.filter(n => n.status !== 'delivered').length
          setUnreadCount(unread)
        })
        .catch(() => {
          // Silently fail
        })
    }
  }, [])

  // Get user initials
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

  // Format notification date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search farms, crops, or schedules..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                <>
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="cursor-pointer">
                      <div className="flex flex-col space-y-1 w-full">
                        <p className="text-sm font-medium line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-center justify-center text-primary cursor-pointer"
                    onClick={() => router.push('/notifications')}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  {user ? (
                    <AvatarFallback className="bg-green-600 text-white">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback>?</AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.phone_number}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>Guest</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/login')}>
                    Login
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
