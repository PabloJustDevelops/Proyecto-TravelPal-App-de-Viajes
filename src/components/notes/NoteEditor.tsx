'use client'

import { useState } from 'react'
import { Note } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  EyeIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface NoteEditorProps {
  note?: Note
  tripId?: string
  onSave: (noteData: Partial<Note>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function NoteEditor({ note, tripId, onSave, onCancel, loading = false }: NoteEditorProps) {
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    category: note?.category || 'general' as const,
    trip_id: note?.trip_id || tripId || '',
  })
  const [isPreview, setIsPreview] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('El título y el contenido son requeridos')
      return
    }

    try {
      await onSave(formData)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la nota'
      setError(errorMessage)
    }
  }

  const renderMarkdownPreview = (content: string) => {
    // Simple markdown rendering for preview
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/gm, '<p class="mb-4">$1</p>')
  }

  const categories = [
    { value: 'general', label: 'General', icon: '📝' },
    { value: 'itinerary', label: 'Itinerario', icon: '📅' },
    { value: 'accommodation', label: 'Alojamiento', icon: '🏨' },
    { value: 'transport', label: 'Transporte', icon: '🚗' },
    { value: 'restaurant', label: 'Restaurante', icon: '🍽️' },
    { value: 'activity', label: 'Actividad', icon: '🎯' },
    { value: 'shopping', label: 'Compras', icon: '🛍️' },
    { value: 'emergency', label: 'Emergencia', icon: '🚨' },
    { value: 'contact', label: 'Contacto', icon: '📞' },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {note ? 'Editar Nota' : 'Nueva Nota'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? (
                <>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Vista Previa
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!isPreview ? (
            <>
              {/* Title */}
              <Input
                label="Título *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Título de la nota"
                required
              />

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Categoría *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {categories.map((category) => (
                    <label
                      key={category.value}
                      className={`relative flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-colors ${
                        formData.category === category.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={formData.category === category.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="text-lg mb-1">{category.icon}</span>
                      <span className="text-xs text-center font-medium">
                        {category.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contenido *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={12}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="Escribe tu nota aquí... Puedes usar Markdown:

# Título Principal
## Subtítulo
**Texto en negrita**
*Texto en cursiva*
`código`

- Lista item 1
- Lista item 2"
                  data-testid="note-content-textarea"
                  required
                />
                <p className="text-xs text-gray-500">
                  Puedes usar Markdown para formatear tu texto. Usa la vista previa para ver cómo se verá.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {categories.find(c => c.value === formData.category)?.icon}
                  </span>
                  <h1 className="text-2xl font-bold">{formData.title || 'Sin título'}</h1>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[300px]">
                  {formData.content ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdownPreview(formData.content) 
                      }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">Sin contenido para mostrar</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="submit"
              loading={loading}
              className="flex-1 sm:flex-none"
            >
              {note ? 'Actualizar Nota' : 'Guardar Nota'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}