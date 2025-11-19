"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Droplets } from "lucide-react"

export default function AdminSchedulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Irrigation Schedules</h1>
        <p className="text-muted-foreground">
          Manage all irrigation schedules system-wide
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Droplets className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center">
            Schedules management page is under development
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
