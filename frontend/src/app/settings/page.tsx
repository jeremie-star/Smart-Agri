"use client"

import React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Settings as SettingsIcon, Globe, Bell, Lock, User, Save, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import toast from "react-hot-toast"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [settings, setSettings] = React.useState({
    name: "",
    phone_number: "",
    language: "English",
    notifications: {
      enabled: true,
      email: true,
      sms: true,
      email_address: "",
    }
  })

  React.useEffect(() => {
    loadProfile()
    loadNotificationPreferences()
  }, [])

  const loadProfile = async () => {
    try {
      const { farmerApi } = await import("@/services/farmer.service")
      const farmer = await farmerApi.getProfile()
      setSettings(prev => ({
        ...prev,
        name: farmer.name,
        phone_number: farmer.phone_number,
        language: farmer.language_preference
      }))
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const loadNotificationPreferences = async () => {
    try {
      const { farmerApi } = await import("@/services/farmer.service")
      const prefs = await farmerApi.getNotificationPreferences()
      setSettings(prev => ({
        ...prev,
        notifications: {
          enabled: prefs.notification_enabled,
          email: prefs.email_enabled,
          sms: prefs.sms_enabled,
          email_address: prefs.email_address || "",
        }
      }))
    } catch (error) {
      console.error("Error loading notification preferences:", error)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const { farmerApi } = await import("@/services/farmer.service")
      
      // Update profile
      await farmerApi.updateProfile({
        name: settings.name,
        language_preference: settings.language as any
      })
      
      // Update notification preferences
      await farmerApi.updateNotificationPreferences({
        notification_enabled: settings.notifications.enabled,
        email_enabled: settings.notifications.email,
        sms_enabled: settings.notifications.sms,
        email_address: settings.notifications.email_address || undefined,
      })
      
      toast.success("Settings saved successfully!")
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast.error(error.response?.data?.detail || "Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+250788123456"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your phone number
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language Preferences
                </CardTitle>
                <CardDescription>
                  Choose your preferred language for the app
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Swahili">Swahili</SelectItem>
                      <SelectItem value="Kinyarwanda">Kinyarwanda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Master switch for all notifications
                    </p>
                  </div>
                  <Switch
                    id="notifications-enabled"
                    checked={settings.notifications.enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, enabled: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={settings.notifications.sms}
                    disabled={!settings.notifications.enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, sms: checked }
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    disabled={!settings.notifications.enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: checked }
                      })
                    }
                  />
                </div>
                {settings.notifications.email && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="email-address">Email Address</Label>
                    <Input
                      id="email-address"
                      type="email"
                      placeholder="your.email@example.com"
                      value={settings.notifications.email_address}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_address: e.target.value }
                        })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
