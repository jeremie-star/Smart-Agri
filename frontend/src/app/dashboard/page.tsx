"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  Droplets, 
  Sprout, 
  CloudRain, 
  TrendingUp, 
  AlertTriangle,
  Calendar
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const stats = [
  {
    title: "Total Farms",
    value: "4",
    change: "+2 this month",
    icon: Sprout,
    color: "text-green-600"
  },
  {
    title: "Active Schedules",
    value: "8",
    change: "3 pending",
    icon: Calendar,
    color: "text-blue-600"
  },
  {
    title: "Water Saved",
    value: "1,234L",
    change: "+15% vs last month",
    icon: Droplets,
    color: "text-cyan-600"
  },
  {
    title: "System Status",
    value: "Healthy",
    change: "All systems operational",
    icon: TrendingUp,
    color: "text-green-600"
  }
]

const recentActivities = [
  {
    id: 1,
    type: "irrigation",
    message: "Irrigation completed for Farm A - Tomatoes",
    time: "2 hours ago",
    status: "success"
  },
  {
    id: 2,
    type: "alert",
    message: "Low soil moisture detected in Farm B",
    time: "4 hours ago",
    status: "warning"
  },
  {
    id: 3,
    type: "weather",
    message: "Rain expected tomorrow in your area",
    time: "6 hours ago",
    status: "info"
  },
  {
    id: 4,
    type: "irrigation",
    message: "Irrigation schedule created for Farm C",
    time: "1 day ago",
    status: "success"
  }
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your farms and irrigation systems.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest irrigation events and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                      <Badge
                        variant={
                          activity.status === "success"
                            ? "success"
                            : activity.status === "warning"
                            ? "warning"
                            : "default"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions & Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Weather Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5" />
                  Weather Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold">24°C</div>
                  <p className="text-sm text-muted-foreground">Partly Cloudy</p>
                  <div className="mt-4 flex justify-around text-sm">
                    <div>
                      <p className="text-muted-foreground">Humidity</p>
                      <p className="font-semibold">65%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Wind</p>
                      <p className="font-semibold">12 km/h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Low Soil Moisture</p>
                      <p className="text-xs text-muted-foreground">Farm B needs attention</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Scheduled Irrigation</p>
                      <p className="text-xs text-muted-foreground">Farm A in 2 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
