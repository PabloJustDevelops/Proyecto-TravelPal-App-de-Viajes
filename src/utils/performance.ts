// Utilidades para monitoreo de rendimiento

// Tipos específicos para las funciones
type AnyFunction = (...args: unknown[]) => unknown;

// Interfaces para Web Vitals
interface PerformanceEntryWithProcessing extends PerformanceEntry {
  processingStart?: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface NavigationEntry extends PerformanceEntry {
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

// Medición de tiempo de renderizado
export function measureRenderTime(componentName: string) {
  return function <T extends AnyFunction>(
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const method = descriptor.value!

    descriptor.value = ((...args: Parameters<T>) => {
      const start = performance.now()
      const result = method.apply(target, args)
      const end = performance.now()
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName}.${propertyName} took ${end - start} milliseconds`)
      }
      
      return result
    }) as T

    return descriptor
  }
}

// Debounce para optimizar eventos frecuentes
export function debounce<T extends AnyFunction>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

// Throttle para limitar la frecuencia de ejecución
export function throttle<T extends AnyFunction>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memoización simple para funciones costosas
export function memoize<T extends AnyFunction>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args) as ReturnType<T>
    cache.set(key, result)
    
    return result
  }) as T
}

// Lazy loading de imágenes
export function lazyLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Intersection Observer para lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Medición de Web Vitals
export function measureWebVitals() {
  if (typeof window === 'undefined') return

  // Largest Contentful Paint (LCP)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    const lastEntry = entries[entries.length - 1]
    console.log('LCP:', lastEntry.startTime)
  }).observe({ entryTypes: ['largest-contentful-paint'] })

  // First Input Delay (FID)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    entries.forEach((entry) => {
      const entryWithProcessing = entry as PerformanceEntryWithProcessing
      // Verificar si la propiedad existe antes de usarla
      if ('processingStart' in entryWithProcessing && 'startTime' in entryWithProcessing) {
        console.log('FID:', (entryWithProcessing.processingStart || 0) - entryWithProcessing.startTime)
      }
    })
  }).observe({ entryTypes: ['first-input'] })

  // Cumulative Layout Shift (CLS)
  let clsValue = 0
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries()
    entries.forEach((entry) => {
      const layoutShiftEntry = entry as LayoutShiftEntry
      if (!layoutShiftEntry.hadRecentInput) {
        clsValue += layoutShiftEntry.value
        console.log('CLS:', clsValue)
      }
    })
  }).observe({ entryTypes: ['layout-shift'] })
}

// Optimización de scroll
export function optimizeScroll(element: HTMLElement, callback: () => void) {
  let ticking = false

  function updateCallback() {
    callback()
    ticking = false
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateCallback)
      ticking = true
    }
  }

  element.addEventListener('scroll', requestTick, { passive: true })

  return () => {
    element.removeEventListener('scroll', requestTick)
  }
}

// Preload de recursos críticos
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type

  document.head.appendChild(link)
}

// Análisis de bundle size (desarrollo)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        const navigationEntry = entry as NavigationEntry
        console.log('Bundle analysis:', {
          transferSize: navigationEntry.transferSize,
          encodedBodySize: navigationEntry.encodedBodySize,
          decodedBodySize: navigationEntry.decodedBodySize,
        })
      }
    })
  })

  observer.observe({ entryTypes: ['navigation'] })
}