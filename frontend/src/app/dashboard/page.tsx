"use client"

import React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Droplets, 
  Sprout, 
  CloudRain, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Plus,
  Loader2,
  MessageSquare
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateFarmDialog } from "@/components/forms/create-farm-dialog"
import { WeatherForecastCard } from "@/components/weather/weather-forecast-card"
import { farmsApi } from "@/services/farms.service"
import { irrigationApi } from "@/services/irrigation.service"
import type { Farm, IrrigationSchedule } from "@/types/api"
import toast from "react-hot-toast"

export default function DashboardPage() {
  const router = useRouter()
  const [farms, setFarms] = React.useState<Farm[]>([])
  const [schedules, setSchedules] = React.useState<IrrigationSchedule[]>([])
  const [weather, setWeather] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  React.useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const farmsData = await farmsApi.getFarms()
      setFarms(farmsData)
      
      // Load schedules for all farms
      if (farmsData.length > 0) {
        const allSchedules = await Promise.all(
          farmsData.map(farm => irrigationApi.getSchedule(farm.id))
        )
        setSchedules(allSchedules.flat())
        
        // Load weather for the first farm
        try {
          const { weatherApi } = await import("@/services/weather.service")
          const weatherData = await weatherApi.getCurrentWeather(farmsData[0].id)
          setWeather(weatherData)
        } catch (error) {
          console.error("Error loading weather:", error)
        }
      }
    } catch (error: any) {
      console.error("Error loading dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    {
      title: "Total Farms",
      value: farms.length.toString(),
      change: farms.length === 0 ? "Get started by adding a farm" : `${farms.length} farm${farms.length > 1 ? 's' : ''} registered`,
      icon: Sprout,
      color: "text-green-600"
    },
    {
      title: "Active Schedules",
      value: schedules.length.toString(),
      change: `${schedules.filter(s => s.status === "pending").length} pending`,
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Completed Today",
      value: schedules.filter(s => s.status === "completed" && new Date(s.created_at).toDateString() === new Date().toDateString()).length.toString(),
      change: "Irrigation tasks",
      icon: Droplets,
      color: "text-cyan-600"
    },
    {
      title: "System Status",
      value: "Active",
      change: "All systems operational",
      icon: TrendingUp,
      color: "text-green-600"
    }
  ]

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s an overview of your farms and irrigation systems.
            </p>
          </div>
          {farms.length === 0 && (
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Farm
            </Button>
          )}
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

        {/* Weather Forecast (Full Width) */}
        {farms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <WeatherForecastCard farmId={farms[0].id} />
          </motion.div>
        )}

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
                <CardTitle>Recent Irrigation Schedules</CardTitle>
                <CardDescription>
                  Your latest irrigation activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="text-center py-12">
                    <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No irrigation schedules yet</p>
                    <Button onClick={() => router.push("/irrigation")} variant="outline">
                      Create Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.slice(0, 5).map((schedule) => {
                      const farm = farms.find(f => f.id === schedule.farm_id)
                      const statusVariant = schedule.status === "completed" ? "success" : schedule.status === "pending" ? "default" : "secondary"
                      
                      return (
                        <div
                          key={schedule.id}
                          className="flex items-start space-x-4 rounded-lg border p-4"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {farm?.crop_type || "Unknown Farm"} - {schedule.water_amount}L
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Scheduled: {new Date(schedule.recommended_date).toLocaleString()}
                            </p>
                            {schedule.ai_reasoning && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {schedule.ai_reasoning}
                              </p>
                            )}
                          </div>
                          <Badge variant={statusVariant as any}>
                            {schedule.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
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
                {weather ? (
                  <div className="text-center">
                    <div className="text-4xl font-bold">{weather.temperature.toFixed(1)}°C</div>
                    <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Humidity</p>
                        <p className="font-semibold">{weather.humidity.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wind</p>
                        <p className="font-semibold">{weather.wind_speed.toFixed(1)} km/h</p>
                      </div>
                      {weather.precipitation > 0 && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Precipitation</p>
                          <p className="font-semibold">{weather.precipitation.toFixed(1)} mm</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : farms.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Add a farm to see weather data</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {farms.length === 0 ? (
                    <>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Farm
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Start by registering your farm to get AI-powered irrigation recommendations
                      </p>
                    </>
                  ) : (
                    <>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => router.push("/irrigation")}
                      >
                        <Droplets className="h-4 w-4 mr-2" />
                        Create Irrigation Schedule
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => router.push("/chat")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ask AI Assistant
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Farm
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Create Farm Dialog */}
        <CreateFarmDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadDashboardData}
        />
      </div>
    </DashboardLayout>
  )
}
