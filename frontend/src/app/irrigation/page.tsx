"use client"

import React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Droplets, Calendar, AlertCircle, CheckCircle2, Clock, Loader2, Sparkles } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { farmsApi } from "@/services/farms.service"
import { irrigationApi } from "@/services/irrigation.service"
import type { Farm, IrrigationSchedule } from "@/types/api"
import toast from "react-hot-toast"

export default function IrrigationPage() {
  const router = useRouter()
  const [farms, setFarms] = React.useState<Farm[]>([])
  const [selectedFarmId, setSelectedFarmId] = React.useState<string>("")
  const [schedules, setSchedules] = React.useState<IrrigationSchedule[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    loadFarms()
  }, [])

  React.useEffect(() => {
    if (selectedFarmId) {
      loadSchedules(selectedFarmId)
    }
  }, [selectedFarmId])

  const loadFarms = async () => {
    try {
      setIsLoading(true)
      const data = await farmsApi.getFarms()
      setFarms(data)
      if (data.length > 0) {
        setSelectedFarmId(data[0].id)
      }
    } catch (error: any) {
      console.error("Error loading farms:", error)
      toast.error("Failed to load farms")
    } finally {
      setIsLoading(false)
    }
  }

  const loadSchedules = async (farmId: string) => {
    try {
      const data = await irrigationApi.getSchedule(farmId)
      setSchedules(data)
    } catch (error: any) {
      console.error("Error loading schedules:", error)
      toast.error("Failed to load schedules")
    }
  }

  const handleGenerateSchedule = async () => {
    if (!selectedFarmId) {
      toast.error("Please select a farm first")
      return
    }

    try {
      setIsGenerating(true)
      const response: any = await irrigationApi.generateSchedule({ farm_id: selectedFarmId })
      toast.success(`Generated ${response.schedules_created} irrigation schedules!`)
      loadSchedules(selectedFarmId)
    } catch (error: any) {
      console.error("Error generating schedule:", error)
      toast.error(error.response?.data?.detail || "Failed to generate schedule")
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "sent":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "sent":
        return <AlertCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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

  if (farms.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Irrigation Management</h1>
            <p className="text-muted-foreground">
              AI-powered irrigation scheduling for your farms
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Droplets className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No farms registered</h3>
              <p className="text-muted-foreground text-center mb-6">
                Register your first farm to start generating irrigation schedules
              </p>
              <Button onClick={() => router.push("/farms")}>
                Register Farm
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const selectedFarm = farms.find(f => f.id === selectedFarmId)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Irrigation Management</h1>
            <p className="text-muted-foreground">
              AI-powered irrigation scheduling for your farms
            </p>
          </div>
        </div>

        {/* Farm Selector and Generate Button */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a farm" />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.crop_type} - {farm.land_size} acres
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleGenerateSchedule} 
            disabled={isGenerating} 
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Schedule
              </>
            )}
          </Button>
        </div>

        {/* Farm Details Card */}
        {selectedFarm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Farm Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Crop Type</p>
                    <p className="font-medium">{selectedFarm.crop_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Land Size</p>
                    <p className="font-medium">{selectedFarm.land_size} acres</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Soil Type</p>
                    <p className="font-medium">{selectedFarm.soil_type || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-xs">
                      {selectedFarm.latitude.toFixed(4)}, {selectedFarm.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Irrigation Schedules */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Irrigation Schedules</h2>
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate an AI-powered irrigation schedule for this farm
                </p>
                <Button onClick={handleGenerateSchedule} disabled={isGenerating} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule, index) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className={`h-12 w-12 rounded-full ${getStatusColor(schedule.status)} flex items-center justify-center text-white`}>
                            {getStatusIcon(schedule.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {new Date(schedule.recommended_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </h3>
                              <Badge variant={schedule.status === "completed" ? "success" : "default"}>
                                {schedule.status}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-muted-foreground">Water Amount:</span>
                                <span className="font-medium">{schedule.water_amount}L</span>
                              </div>
                              {schedule.weather_condition && (
                                <div className="text-muted-foreground">
                                  {schedule.weather_condition}
                                </div>
                              )}
                              {schedule.ai_reasoning && (
                                <div className="mt-3 p-3 bg-muted rounded-md">
                                  <p className="text-sm font-medium mb-1">AI Recommendation:</p>
                                  <p className="text-sm text-muted-foreground">{schedule.ai_reasoning}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
