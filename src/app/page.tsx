'use client'

import Link from 'next/link'
import { MapPin, Calendar, DollarSign, ShieldCheck } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Gestión de Vuelos</span>
              <span className="text-2xl font-bold text-blue-600">✈️ Gestión de Vuelos</span>
            </a>
          </div>
          <div className="flex flex-1 justify-end space-x-4">
            <Link href="/signin" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors">
              Iniciar Sesión
            </Link>
            <Link 
              href="/signup" 
              className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Organiza tus viajes de manera inteligente
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Planifica, gestiona y controla todos los aspectos de tus viajes en un solo lugar. Desde el itinerario hasta el presupuesto, todo bajo control.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signin"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Comenzar ahora
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Saber más <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Todo en uno</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Todo lo que necesitas para tu próximo viaje
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Gestión de Itinerarios
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Organiza tus destinos, vuelos y alojamientos de forma visual y sencilla.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <DollarSign className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Control de Gastos
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Mantén tu presupuesto a raya registrando cada gasto durante tu viaje.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Calendar className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Planificación Flexible
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Ajusta tus planes sobre la marcha y mantén todo sincronizado.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Seguro y Privado
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Tus datos están protegidos y solo tú tienes acceso a ellos.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
