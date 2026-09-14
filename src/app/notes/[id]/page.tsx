'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createInsforgeClient, Note, Trip } from '@/lib/insforge'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NoteEditor from '@/components/notes/NoteEditor'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate, getErrorMessage } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

export default function NoteDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const [note, setNote] = useState<(Note & { trip?: Trip }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editorLoading, setEditorLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadNote = useCallback(async () => {
    const insforge = createInsforgeClient()

    try {
      const query = insforge
        .database.from('notes')
        .select(`
          *,
          trip:trips(*)
        `)
        .eq('id', noteId)
        .eq('user_id', user!.id)
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      );

      const { data, error } = await Promise.race([
        query,
        timeoutPromise
      ]) as any;

      if (error) {
        if (error.code === 'PGRST116') {
          router.push('/notes')
          return
        }
        throw error
      }

      setNote(data)
    } catch (err: unknown) {
      if ((err as Error).message === "Timeout") {
        logger.warn("NoteDetailPage: Note fetch timed out");
      } else {
        const message = getErrorMessage(err, 'Error desconocido')
        logger.error('NoteDetailPage: Error loading note', { error: message })
      }
    } finally {
      setLoading(false)
    }
  }, [user, noteId, router])

  useEffect(() => {
    if (user && noteId) {
      loadNote()
    }
  }, [user, noteId, loadNote])

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (!note) return

    setEditorLoading(true)
    const insforge = createInsforgeClient()

    try {
      const { error } = await insforge
        .database.from('notes')
        .update({
          title: noteData.title,
          content: noteData.content,
          category: noteData.category,
          trip_id: noteData.trip_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', note.id)

      if (error) throw error

      await loadNote()
      setIsEditing(false)
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al guardar la nota')
      logger.error('NoteDetailPage: Error saving note', { error: message })
      throw new Error(message)
    } finally {
      setEditorLoading(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!note || !confirm('¿Estás seguro de que quieres eliminar esta nota?')) return

    setDeleteLoading(true)
    const insforge = createInsforgeClient()

    try {
      const { error } = await insforge
        .database.from('notes')
        .delete()
        .eq('id', note.id)

      if (error) throw error

      router.push('/notes')
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Error al eliminar la nota')
      logger.error('NoteDetailPage: Error deleting note', { error: message })
      alert(message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getCategoryIcon = (category: string | undefined) => {
    if (!category) return '📝'
    const icons: Record<string, string> = {
      general: '📝',
      itinerary: '📅',
      accommodation: '🏨',
      transport: '🚗',
      restaurant: '🍽️',
      activity: '🎯',
      shopping: '🛍️',
      emergency: '🚨',
      contact: '📞',
    }
    return icons[category] || '📝'
  }

  const getCategoryName = (category: string | undefined) => {
    if (!category) return 'General'
    const names: Record<string, string> = {
      general: 'General',
      itinerary: 'Itinerario',
      accommodation: 'Alojamiento',
      transport: 'Transporte',
      restaurant: 'Restaurante',
      activity: 'Actividad',
      shopping: 'Compras',
      emergency: 'Emergencia',
      contact: 'Contacto',
    }
    return names[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-800',
      itinerary: 'bg-blue-100 text-blue-800',
      accommodation: 'bg-purple-100 text-purple-800',
      transport: 'bg-green-100 text-green-800',
      restaurant: 'bg-orange-100 text-orange-800',
      activity: 'bg-pink-100 text-pink-800',
      shopping: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-100 text-red-800',
      contact: 'bg-indigo-100 text-indigo-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering for display
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/gim, '<br>')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!note) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Nota no encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            La nota que buscas no existe o no tienes permisos para verla.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/notes')}>
              Volver a Notas
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isEditing) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Cancelar Edición
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Nota</h1>
          </div>

          <NoteEditor
            note={note}
            onSave={handleSaveNote}
            onCancel={() => setIsEditing(false)}
            loading={editorLoading}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/notes')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Notas
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {note.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="mr-2">{getCategoryIcon(note.category)}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                      note.category || 'general'
                    )}`}
                  >
                    {getCategoryName(note.category || 'general')}
                  </span>
                </div>
                
                {note.trip && (
                  <div className="flex items-center">
                    <span className="mr-1">📍</span>
                    <span>{note.trip.title}</span>
                  </div>
                )}
                
                <div>
                  Actualizada: {formatDate(note.updated_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              <Button
                variant="danger"
                onClick={handleDeleteNote}
                loading={deleteLoading}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Contenido</h2>
              <div className="flex items-center text-sm text-gray-500">
                <EyeIcon className="h-4 w-4 mr-1" />
                Vista previa
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(note.content)
                }}
              />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Información</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Creada:</span>
              <span className="ml-2 text-gray-900">
                {formatDate(note.created_at)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Última actualización:</span>
              <span className="ml-2 text-gray-900">
                {formatDate(note.updated_at)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Categoría:</span>
              <span className="ml-2 text-gray-900">
                {getCategoryName(note.category)}
              </span>
            </div>
            {note.trip && (
              <div>
                <span className="text-gray-500">Viaje asociado:</span>
                <span className="ml-2 text-gray-900">
                  {note.trip.title}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}