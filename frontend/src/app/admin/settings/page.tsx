"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Settings className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center">
            Settings page is under development
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
