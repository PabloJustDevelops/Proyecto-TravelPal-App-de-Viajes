"use client";

import React, { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from './Navbar'
import ChatbotButton from '@/components/chatbot/ChatbotButton'
import ChatbotWindow from '@/components/chatbot/ChatbotWindow'
import { HomeIcon, MapPinIcon, CurrencyDollarIcon, DocumentTextIcon, BellIcon, ChartBarIcon, ChartPieIcon, CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tareas', href: '/tasks', icon: ClipboardDocumentListIcon },
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
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-ink">
        <Navbar navigation={navigation} />
        <main className="max-w-7xl mx-auto py-section px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        
        {isChatbotOpen && (
          <ChatbotWindow onClose={() => setIsChatbotOpen(false)} />
        )}
        
        <ChatbotButton
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
          isOpen={isChatbotOpen}
        />
      </div>
    </ProtectedRoute>
  )
}