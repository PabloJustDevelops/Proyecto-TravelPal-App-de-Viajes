import { createElement, type ComponentType, type SVGProps } from 'react'
import {
  BuildingOffice2Icon,
  CakeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  TicketIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

/**
 * Unica fuente de verdad para el icono de una categoria de dominio
 * (gastos, notas, reservas, actividades de itinerario).
 */
const CATEGORY_ICONS: Record<string, IconComponent> = {
  general: DocumentTextIcon,
  other: TagIcon,
  itinerary: CalendarDaysIcon,
  accommodation: BuildingOffice2Icon,
  hotel: BuildingOffice2Icon,
  transport: TruckIcon,
  car: TruckIcon,
  flight: PaperAirplaneIcon,
  food: CakeIcon,
  restaurant: CakeIcon,
  entertainment: TicketIcon,
  activity: SparklesIcon,
  shopping: ShoppingBagIcon,
  health: HeartIcon,
  insurance: ShieldCheckIcon,
  emergency: ExclamationTriangleIcon,
  contact: PhoneIcon,
}

export function getCategoryIcon(category?: string | null): IconComponent {
  return (category ? CATEGORY_ICONS[category] : undefined) ?? TagIcon
}

interface CategoryIconProps {
  category?: string | null
  className?: string
}

export default function CategoryIcon({ category, className }: CategoryIconProps) {
  return createElement(getCategoryIcon(category), { className, 'aria-hidden': true })
}
