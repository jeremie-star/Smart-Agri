"use client"

import React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Sprout, MapPin, Plus, Loader2, Edit, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateFarmDialog } from "@/components/forms/create-farm-dialog"
import { EditFarmDialog } from "@/components/forms/edit-farm-dialog"
import { farmsApi } from "@/services/farms.service"
import type { Farm } from "@/types/api"
import toast from "react-hot-toast"

export default function FarmsPage() {
  const router = useRouter()
  const [farms, setFarms] = React.useState<Farm[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedFarm, setSelectedFarm] = React.useState<Farm | null>(null)

  React.useEffect(() => {
    loadFarms()
  }, [])

  const loadFarms = async () => {
    try {
      setIsLoading(true)
      const data = await farmsApi.getFarms()
      setFarms(data)
    } catch (error: any) {
      console.error("Error loading farms:", error)
      toast.error("Failed to load farms")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (farm: Farm) => {
    setSelectedFarm(farm)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (farmId: string) => {
    if (!confirm("Are you sure you want to delete this farm?")) return
    
    try {
      await farmsApi.deleteFarm(farmId)
      toast.success("Farm deleted successfully")
      loadFarms()
    } catch (error) {
      toast.error("Failed to delete farm")
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Farms</h1>
            <p className="text-muted-foreground">
              Manage your registered farms and crops
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Farm
          </Button>
        </div>

        {/* Farms Grid */}
        {farms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sprout className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No farms registered yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start by adding your first farm to get AI-powered irrigation recommendations
              </p>
              <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Your First Farm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm, index) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-xl">{farm.crop_type}</CardTitle>
                      </div>
                      <Badge variant="outline">{farm.land_size} acres</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {farm.soil_type && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Soil Type:</span>{" "}
                        <span className="font-medium">{farm.soil_type}</span>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Registered: {new Date(farm.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => handleEdit(farm)}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(farm.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Farm Dialog */}
        <CreateFarmDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={loadFarms}
        />

        {/* Edit Farm Dialog */}
        <EditFarmDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={loadFarms}
          farm={selectedFarm}
        />
      </div>
    </DashboardLayout>
  )
}
