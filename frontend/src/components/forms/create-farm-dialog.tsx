"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, MapPin, Sprout } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { farmsApi } from "@/services/farms.service"
import type { CreateFarmRequest } from "@/types/api"
import toast from "react-hot-toast"

const farmSchema = z.object({
  crop_type: z.string().min(2, "Crop type must be at least 2 characters"),
  land_size: z.number().min(0.01, "Land size must be greater than 0"),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  soil_type: z.string().optional(),
})

type FarmFormData = z.infer<typeof farmSchema>

interface CreateFarmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateFarmDialog({ open, onOpenChange, onSuccess }: CreateFarmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      crop_type: "",
      land_size: 0,
      latitude: 0,
      longitude: 0,
      soil_type: "",
    },
  })

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setUseCurrentLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude)
        setValue("longitude", position.coords.longitude)
        setUseCurrentLocation(false)
        toast.success("Location detected!")
      },
      (error) => {
        setUseCurrentLocation(false)
        toast.error("Unable to get your location. Please enter manually.")
        console.error("Geolocation error:", error)
      }
    )
  }

  const onSubmit = async (data: FarmFormData) => {
    try {
      setIsLoading(true)
      const farmData: CreateFarmRequest = {
        crop_type: data.crop_type,
        land_size: Number(data.land_size),
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        soil_type: data.soil_type || undefined,
      }
      
      await farmsApi.createFarm(farmData)
      toast.success("Farm created successfully!")
      reset()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error("Error creating farm:", error)
      toast.error(error.response?.data?.detail || "Failed to create farm")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            Register New Farm
          </DialogTitle>
          <DialogDescription>
            Add your farm details to get AI-powered irrigation recommendations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Crop Type */}
          <div className="space-y-2">
            <Label htmlFor="crop_type">
              Crop Type <span className="text-destructive">*</span>
            </Label>
            <Input
              id="crop_type"
              placeholder="e.g., Tomatoes, Maize, Rice"
              {...register("crop_type")}
            />
            {errors.crop_type && (
              <p className="text-sm text-destructive">{errors.crop_type.message}</p>
            )}
          </div>

          {/* Land Size */}
          <div className="space-y-2">
            <Label htmlFor="land_size">
              Land Size (acres) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="land_size"
              type="number"
              step="0.01"
              placeholder="e.g., 2.5"
              {...register("land_size", { valueAsNumber: true })}
            />
            {errors.land_size && (
              <p className="text-sm text-destructive">{errors.land_size.message}</p>
            )}
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Farm Location <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={useCurrentLocation}
              >
                {useCurrentLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  "Use Current Location"
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-1.2921"
                  {...register("latitude", { valueAsNumber: true })}
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="36.8219"
                  {...register("longitude", { valueAsNumber: true })}
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude.message}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You can use the "Use Current Location" button or enter coordinates manually.
              For East Africa: Latitude is usually negative (-1 to -4), Longitude is positive (29 to 42).
            </p>
          </div>

          {/* Soil Type (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="soil_type">
              Soil Type <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="soil_type"
              placeholder="e.g., Clay, Loam, Sandy"
              {...register("soil_type")}
            />
            {errors.soil_type && (
              <p className="text-sm text-destructive">{errors.soil_type.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Farm"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
