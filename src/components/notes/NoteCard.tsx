'use client'

import { Note } from '@/lib/insforge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import {
  CalendarIcon,
  TagIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import CategoryIcon from '@/components/ui/CategoryIcon'

interface NoteWithTrip extends Note {
  trip?: {
    title: string
  }
}

interface NoteCardProps {
  note: Note | NoteWithTrip
  showTripTitle?: boolean
  onEdit?: (note: Note) => void
}

export default function NoteCard({ note, showTripTitle = false, onEdit }: NoteCardProps) {
  const getCategoryName = (category: Note['category']) => {
    switch (category) {
      case 'itinerary':
        return 'Itinerario'
      case 'accommodation':
        return 'Alojamiento'
      case 'transport':
        return 'Transporte'
      case 'restaurant':
        return 'Restaurante'
      case 'activity':
        return 'Actividad'
      case 'shopping':
        return 'Compras'
      case 'emergency':
        return 'Emergencia'
      case 'contact':
        return 'Contacto'
      default:
        return 'General'
    }
  }

  const getCategoryColor = (category: Note['category']) => {
    switch (category) {
      case 'itinerary':
        return 'bg-blue-100 text-blue-800'
      case 'accommodation':
        return 'bg-purple-100 text-purple-800'
      case 'transport':
        return 'bg-green-100 text-green-800'
      case 'restaurant':
        return 'bg-orange-100 text-orange-800'
      case 'activity':
        return 'bg-pink-100 text-pink-800'
      case 'shopping':
        return 'bg-yellow-100 text-yellow-800'
      case 'emergency':
        return 'bg-red-100 text-red-800'
      case 'contact':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Card className="hover:shadow-md transition-shadow relative group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <CategoryIcon
              category={note.category}
              className="h-5 w-5 text-gray-500"
            />
            <span className="line-clamp-1">{note.title}</span>
          </CardTitle>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        {showTripTitle && (note as NoteWithTrip).trip && (
          <div className="text-sm text-gray-500 mt-1">
            {(note as NoteWithTrip).trip?.title}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category */}
        <div className="flex items-center space-x-2">
          <TagIcon className="h-4 w-4 text-gray-400" />
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
              note.category
            )}`}
          >
            {getCategoryName(note.category)}
          </span>
        </div>

        {/* Content Preview */}
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-700 text-sm leading-relaxed">
            {truncateContent(note.content)}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center space-x-2 text-gray-500 text-sm pt-2 border-t border-gray-100">
          <CalendarIcon className="h-4 w-4" />
          <span>Actualizado {formatDate(note.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}