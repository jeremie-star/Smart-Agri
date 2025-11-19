"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications Center</h1>
        <p className="text-muted-foreground">
          View and manage all system notifications
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Bell className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center">
            Notifications center is under development
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
