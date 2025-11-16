"use client"

import React from "react"
import { motion } from "framer-motion"
import { Cloud, CloudRain, Sun, Wind, Droplets, Calendar, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { weatherApi } from "@/services/weather.service"
import type { WeatherData } from "@/types/api"
import toast from "react-hot-toast"

interface WeatherForecastCardProps {
  farmId: string
}

export function WeatherForecastCard({ farmId }: WeatherForecastCardProps) {
  const [forecast, setForecast] = React.useState<WeatherData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    loadForecast()
  }, [farmId])

  const loadForecast = async () => {
    try {
      setIsLoading(true)
      const data = await weatherApi.getForecast(farmId)
      setForecast(data.forecast || [])
    } catch (error: any) {
      console.error("Error loading forecast:", error)
      // Don't show toast error for optional widget
    } finally {
      setIsLoading(false)
    }
  }

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase()
    if (desc.includes("rain") || desc.includes("shower")) {
      return <CloudRain className="h-8 w-8 text-blue-500" />
    } else if (desc.includes("cloud") || desc.includes("overcast")) {
      return <Cloud className="h-8 w-8 text-gray-500" />
    } else {
      return <Sun className="h-8 w-8 text-yellow-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Forecast
          </CardTitle>
          <CardDescription>Weather outlook for your farm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (forecast.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Forecast
          </CardTitle>
          <CardDescription>Weather outlook for your farm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Cloud className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Forecast data unavailable</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          7-Day Forecast
        </CardTitle>
        <CardDescription>Weather outlook for your farm</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {forecast.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div>{getWeatherIcon(day.description)}</div>
                  <div className="flex-1">
                    <div className="font-medium">{formatDate(day.date)}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {day.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{Math.round(day.temperature)}°C</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Droplets className="h-3 w-3" />
                      {day.humidity}%
                    </div>
                  </div>

                  {day.precipitation > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <CloudRain className="h-3 w-3" />
                      {day.precipitation}mm
                    </Badge>
                  )}

                  {day.wind_speed > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wind className="h-3 w-3" />
                      {day.wind_speed}km/h
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
