'use client'

import { Suspense, lazy, ComponentType } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

// Componente wrapper para lazy loading
export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  )
}

// Función helper para crear componentes lazy
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn)
}

// HOC para envolver componentes con lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

// Preloader para componentes críticos
export function preloadComponent(importFn: () => Promise<{ default: ComponentType<Record<string, unknown>> }>) {
  // Precargar el componente en el siguiente tick
  setTimeout(() => {
    importFn().catch(() => {
      // Silenciar errores de precarga
    })
  }, 0)
}

export default LazyWrapper