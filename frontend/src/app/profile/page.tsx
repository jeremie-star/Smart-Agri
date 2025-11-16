"use client"

import React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { User, Phone, Globe, Calendar, CheckCircle2, XCircle, Loader2, LogOut } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { farmerApi } from "@/services/farmer.service"
import { authService } from "@/services/auth.service"
import type { Farmer } from "@/types/api"
import toast from "react-hot-toast"

export default function ProfilePage() {
  const router = useRouter()
  const [farmer, setFarmer] = React.useState<Farmer | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const data = await farmerApi.getProfile()
      setFarmer(data)
    } catch (error: any) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    router.push("/auth/login")
    toast.success("Logged out successfully")
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    try {
      await farmerApi.deleteAccount()
      authService.logout()
      router.push("/auth/register")
      toast.success("Account deleted successfully")
    } catch (error) {
      toast.error("Failed to delete account")
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!farmer) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Profile not found</h3>
            <Button onClick={handleLogout}>Log Out</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Your account information and settings
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{farmer.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4" />
                      {farmer.phone_number}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {farmer.is_verified ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Not Verified
                    </Badge>
                  )}
                  {farmer.is_active && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      Language Preference
                    </div>
                    <p className="text-lg font-medium">{farmer.language_preference}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </div>
                    <p className="text-lg font-medium">
                      {new Date(farmer.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <p className="text-lg font-medium">
                    {new Date(farmer.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push("/settings")}
              >
                Edit Profile & Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto flex-col py-4"
                onClick={() => router.push("/farms")}
              >
                <span className="text-2xl font-bold mb-1">🌾</span>
                <span className="text-sm">My Farms</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col py-4"
                onClick={() => router.push("/irrigation")}
              >
                <span className="text-2xl font-bold mb-1">💧</span>
                <span className="text-sm">Irrigation</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col py-4"
                onClick={() => router.push("/chat")}
              >
                <span className="text-2xl font-bold mb-1">💬</span>
                <span className="text-sm">AI Assistant</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col py-4"
                onClick={() => router.push("/notifications")}
              >
                <span className="text-2xl font-bold mb-1">🔔</span>
                <span className="text-sm">Notifications</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
