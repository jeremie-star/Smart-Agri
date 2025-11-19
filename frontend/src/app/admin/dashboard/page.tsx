"use client"

import React from "react"
import { motion } from "framer-motion"
import { Users, Sprout, Droplets, Bell, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminApi, type SystemStats } from "@/services/admin.service"
import toast from "react-hot-toast"

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getStats()
      setStats(data)
    } catch (error: any) {
      console.error("Error loading stats:", error)
      toast.error("Failed to load statistics")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Farmers",
      value: stats?.total_farmers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Farms",
      value: stats?.total_farms || 0,
      icon: Sprout,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Schedules",
      value: stats?.active_schedules || 0,
      icon: Droplets,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: "Notifications Today",
      value: stats?.notifications_sent_today || 0,
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "New Farmers (Month)",
      value: stats?.farmers_registered_this_month || 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <motion.a
              href="/admin/farmers"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Manage Farmers</p>
                <p className="text-sm text-muted-foreground">View all registered farmers</p>
              </div>
            </motion.a>
            <motion.a
              href="/admin/reports"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-muted-foreground">Analytics and insights</p>
              </div>
            </motion.a>
            <motion.a
              href="/admin/notifications"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">System-wide alerts</p>
              </div>
            </motion.a>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-2">Welcome to Admin Panel! 👋</h3>
          <p className="text-muted-foreground">
            You have full access to manage farmers, farms, irrigation schedules, and system settings. 
            Use the sidebar navigation to explore different sections.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
