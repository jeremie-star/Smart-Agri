"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sprout, Trash2, Edit } from "lucide-react"
import { adminApi, type AdminFarm } from "@/services/admin.service"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"

export default function AdminFarmsPage() {
  const [farms, setFarms] = React.useState<AdminFarm[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    loadFarms()
  }, [])

  const loadFarms = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getAllFarms()
      setFarms(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load farms")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this farm? This action cannot be undone.")) return
    try {
      await adminApi.deleteFarm(id)
      toast.success("Farm deleted")
      loadFarms()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete farm")
    }
  }

  const handleEdit = async (farm: AdminFarm) => {
    const newCrop = prompt("Crop type:", farm.crop_type)
    if (newCrop === null) return
    try {
      await adminApi.updateFarm(farm.id, { crop_type: newCrop })
      toast.success("Farm updated")
      loadFarms()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update farm")
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Sprout className="h-16 w-16 text-muted-foreground mb-4" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Farms Overview</h1>
        <p className="text-muted-foreground">
          View all farms across the system
        </p>
      </div>

      <Card>
        <CardContent>
          {farms.length === 0 ? (
            <div className="text-center py-12">
              <Sprout className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No farms found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Size (acres)</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farms.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.crop_type}</TableCell>
                    <TableCell>{f.land_size}</TableCell>
                    <TableCell>{f.farmer_name || f.farmer_id}</TableCell>
                    <TableCell>
                      {f.latitude.toFixed(3)}, {f.longitude.toFixed(3)}
                    </TableCell>
                    <TableCell>
                      {new Date(f.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(f)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(f.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
