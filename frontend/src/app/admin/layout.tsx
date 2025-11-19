"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { authService } from "@/services/auth.service"
import toast from "react-hot-toast"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Check if user is authenticated and is admin
    const checkAdminAccess = async () => {
      try {
        if (!authService.isAuthenticated()) {
          toast.error("Please login first")
          router.push("/login")
          return
        }

        const user = await authService.getProfile()
        
        if (user.role !== "admin" && user.role !== "super_admin") {
          toast.error("Admin access required")
          router.push("/dashboard")
          return
        }

        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to verify admin access")
        router.push("/login")
      }
    }

    checkAdminAccess()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
