"use client"

import React from "react"
import { motion } from "framer-motion"
import { Users, Search, Filter, CheckCircle2, XCircle, Phone, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { adminApi, type AdminFarmer } from "@/services/admin.service"
import toast from "react-hot-toast"

export default function FarmersPage() {
  const [farmers, setFarmers] = React.useState<AdminFarmer[]>([])
  const [filteredFarmers, setFilteredFarmers] = React.useState<AdminFarmer[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    loadFarmers()
  }, [])

  React.useEffect(() => {
    if (searchTerm) {
      const filtered = farmers.filter(
        (farmer) =>
          farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          farmer.phone_number.includes(searchTerm)
      )
      setFilteredFarmers(filtered)
    } else {
      setFilteredFarmers(farmers)
    }
  }, [searchTerm, farmers])

  const loadFarmers = async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getFarmers(0, 100)
      setFarmers(data)
      setFilteredFarmers(data)
    } catch (error: any) {
      console.error("Error loading farmers:", error)
      toast.error("Failed to load farmers")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const stats = React.useMemo(() => {
    return {
      total: farmers.length,
      active: farmers.filter(f => f.is_active).length,
      verified: farmers.filter(f => f.is_verified).length,
      admins: farmers.filter(f => f.role === 'admin' || f.role === 'super_admin').length,
    }
  }, [farmers])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Farmers Management</h1>
        <p className="text-muted-foreground">
          Manage all registered farmers in the system
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Farms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No farmers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {farmer.phone_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={farmer.role === 'admin' || farmer.role === 'super_admin' ? 'default' : 'secondary'}>
                        {farmer.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{farmer.farms_count}</TableCell>
                    <TableCell>
                      {farmer.is_active ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Inactive</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {farmer.is_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(farmer.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
