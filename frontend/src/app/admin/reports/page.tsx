"use client"

import React from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Users, Sprout, Bell, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminApi, type UsageReport } from "@/services/admin.service"
import toast from "react-hot-toast"

export default function ReportsPage() {
  const [report, setReport] = React.useState<UsageReport | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [days, setDays] = React.useState(30)

  React.useEffect(() => {
    loadReport()
  }, [days])

  const loadReport = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getReports(days)
      setReport(data)
    } catch (error: any) {
      console.error("Error loading report:", error)
      toast.error("Failed to load report")
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

  if (!report) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Reports</h1>
          <p className="text-muted-foreground">
            System analytics for the last {days} days
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Farmers
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.new_farmers}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Farms
                </CardTitle>
                <Sprout className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.new_farms}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Notifications Sent
                </CardTitle>
                <Bell className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.notifications_sent}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Schedules Created
                </CardTitle>
                <Calendar className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.schedules_created}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Farmer Status */}
      <Card>
        <CardHeader>
          <CardTitle>Farmer Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active:</span>
                <span className="font-semibold text-green-600">{report.farmer_status.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Inactive:</span>
                <span className="font-semibold text-red-600">{report.farmer_status.inactive}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Verified:</span>
                <span className="font-semibold text-blue-600">{report.farmer_status.verified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unverified:</span>
                <span className="font-semibold text-gray-600">{report.farmer_status.unverified}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Crops */}
      <Card>
        <CardHeader>
          <CardTitle>Top Crops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.top_crops.map((crop, index) => (
              <div key={crop.crop} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{crop.crop}</span>
                    <span className="text-sm text-muted-foreground">{crop.count} farms</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(crop.count / report.top_crops[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {report.language_distribution.map((lang) => (
              <div key={lang.language} className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold mb-2">{lang.count}</div>
                <div className="text-sm text-muted-foreground">{lang.language}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
