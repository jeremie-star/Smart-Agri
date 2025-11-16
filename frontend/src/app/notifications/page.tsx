"use client"

import React from "react"
import { motion } from "framer-motion"
import { Bell, MessageSquare, Mail, CheckCircle2, XCircle, Loader2, Filter } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notificationsApi } from "@/services/notifications.service"
import type { Notification } from "@/types/api"
import toast from "react-hot-toast"

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<string>("all")

  React.useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const data = await notificationsApi.getHistory(100)
      setNotifications(data)
    } catch (error: any) {
      console.error("Error loading notifications:", error)
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent":
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status.toLowerCase() === "sent" || status.toLowerCase() === "delivered" 
      ? "success" 
      : status.toLowerCase() === "failed" 
      ? "destructive" 
      : "default"
    
    return <Badge variant={variant as any}>{status}</Badge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredNotifications = React.useMemo(() => {
    if (filter === "all") return notifications
    return notifications.filter(n => n.channel.toLowerCase() === filter.toLowerCase())
  }, [notifications, filter])

  const stats = React.useMemo(() => {
    return {
      total: notifications.length,
      sms: notifications.filter(n => n.channel.toLowerCase() === "sms").length,
      email: notifications.filter(n => n.channel.toLowerCase() === "email").length,
      sent: notifications.filter(n => n.status.toLowerCase() === "sent" || n.status.toLowerCase() === "delivered").length,
      failed: notifications.filter(n => n.status.toLowerCase() === "failed").length
    }
  }, [notifications])

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
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              View all your notifications and alerts
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">SMS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.email}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="sms">SMS Only</SelectItem>
              <SelectItem value="email">Email Only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadNotifications}>
            Refresh
          </Button>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                {filter === "all" 
                  ? "You don't have any notifications yet" 
                  : `No ${filter.toUpperCase()} notifications found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {getChannelIcon(notification.channel)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{notification.channel}</Badge>
                            {getStatusBadge(notification.status)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(notification.sent_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusIcon(notification.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
