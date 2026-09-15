"use client";

import React from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from './Navbar'
import { HomeIcon, MapPinIcon, CurrencyDollarIcon, DocumentTextIcon, CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tareas', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Viajes', href: '/trips', icon: MapPinIcon },
  { name: 'Planificación', href: '/planning', icon: CalendarIcon },
  { name: 'Gastos', href: '/expenses', icon: CurrencyDollarIcon },
  { name: 'Notas', href: '/notes', icon: DocumentTextIcon },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-ink">
        <Navbar navigation={navigation} />
        <main className="max-w-7xl mx-auto py-section px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
