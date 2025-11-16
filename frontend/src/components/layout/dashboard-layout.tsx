"use client"

import React from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <div className="relative min-h-screen">
      {/* Sidebar */}
      <Sidebar className="hidden md:block" />
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Sidebar className="md:hidden" />
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-64">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="min-h-[calc(100vh-4rem)] bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
