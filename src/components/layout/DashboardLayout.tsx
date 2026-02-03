import React from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from './Navbar'
import { HomeIcon, MapPinIcon, CurrencyDollarIcon, DocumentTextIcon, BellIcon, ChartBarIcon, ChartPieIcon, CalendarIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Viajes', href: '/trips', icon: MapPinIcon },
  { name: 'Planificación', href: '/planning', icon: CalendarIcon },
  { name: 'Gastos', href: '/expenses', icon: CurrencyDollarIcon },
  { name: 'Presupuesto', href: '/budget', icon: ChartBarIcon },
  { name: 'Análisis', href: '/analytics', icon: ChartPieIcon },
  { name: 'Notas', href: '/notes', icon: DocumentTextIcon },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar navigation={navigation} />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}