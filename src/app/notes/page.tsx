'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NoteCard from '@/components/notes/NoteCard'
import NoteEditor from '@/components/notes/NoteEditor'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient, Note, Trip } from '@/lib/supabase'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<(Note & { trip?: Trip })[]>([])
  const [filteredNotes, setFilteredNotes] = useState<(Note & { trip?: Trip })[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tripFilter, setTripFilter] = useState<string>('all')
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editorLoading, setEditorLoading] = useState(false)

  const loadNotes = useCallback(async () => {
    const supabase = createSupabaseClient()

    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          trip:trips(*)
        `)
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setNotes(data || [])
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadTrips = useCallback(async () => {
    const supabase = createSupabaseClient()

    try {
      const { data, error } = await supabase
          .from('trips')
          .select('id, title, user_id, origin, destination, departure_date, return_date, budget, status, created_at, updated_at')
          .eq('user_id', user!.id)
          .order('departure_date', { ascending: false })
        .order('departure_date', { ascending: false })

      if (error) throw error

      setTrips(data || [])
    } catch (error) {
      console.error('Error loading trips:', error)
    }
  }, [user])

  const filterNotes = useCallback(() => {
    let filtered = notes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.trip?.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((note) => note.category === categoryFilter)
    }

    // Filter by trip
    if (tripFilter !== 'all') {
      filtered = filtered.filter((note) => note.trip_id === tripFilter)
    }

    setFilteredNotes(filtered)
  }, [notes, searchTerm, categoryFilter, tripFilter])

  useEffect(() => {
    if (user) {
      loadNotes()
      loadTrips()
    }
  }, [user, loadNotes, loadTrips])

  useEffect(() => {
    filterNotes()
  }, [notes, searchTerm, categoryFilter, tripFilter, filterNotes])

  const handleSaveNote = async (noteData: Partial<Note>) => {
    setEditorLoading(true)
    const supabase = createSupabaseClient()

    try {
      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            title: noteData.title,
            content: noteData.content,
            category: noteData.category,
            trip_id: noteData.trip_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNote.id)

        if (error) throw error
      } else {
        // Create new note
        const { error } = await supabase
          .from('notes')
          .insert([{
            user_id: user!.id,
            title: noteData.title,
            content: noteData.content,
            category: noteData.category,
            trip_id: noteData.trip_id || null,
          }])

        if (error) throw error
      }

      await loadNotes()
      handleCloseEditor()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la nota'
      throw new Error(errorMessage)
    } finally {
      setEditorLoading(false)
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setEditingNote(null)
  }

  // Funciones auxiliares eliminadas - no se utilizan en este componente

  const getCategoryCounts = () => {
    return notes.reduce((acc, note) => {
      const category = note.category || 'general'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const categoryCounts = getCategoryCounts()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Notas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Organiza y documenta toda la información de tus viajes
            </p>
          </div>
          <Button 
            onClick={() => setShowEditor(true)}
            className="mt-4 sm:mt-0"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Nota
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Total Notas</div>
                <div className="text-2xl font-bold text-gray-900">{notes.length}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl">📅</div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Itinerarios</div>
                <div className="text-2xl font-bold text-gray-900">
                  {categoryCounts.itinerary || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl">🏨</div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Alojamientos</div>
                <div className="text-2xl font-bold text-gray-900">
                  {categoryCounts.accommodation || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl">🚨</div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Emergencias</div>
                <div className="text-2xl font-bold text-gray-900">
                  {categoryCounts.emergency || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las categorías</option>
                <option value="general">General</option>
                <option value="itinerary">Itinerario</option>
                <option value="accommodation">Alojamiento</option>
                <option value="transport">Transporte</option>
                <option value="restaurant">Restaurante</option>
                <option value="activity">Actividad</option>
                <option value="shopping">Compras</option>
                <option value="emergency">Emergencia</option>
                <option value="contact">Contacto</option>
              </select>
            </div>

            {/* Trip Filter */}
            <div className="lg:w-48">
              <select
                value={tripFilter}
                onChange={(e) => setTripFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los viajes</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                showTripTitle 
                onEdit={handleEditNote}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <DocumentTextIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || categoryFilter !== 'all' || tripFilter !== 'all'
                ? 'No se encontraron notas'
                : 'No tienes notas registradas'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || categoryFilter !== 'all' || tripFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera nota'}
            </p>
            {(!searchTerm && categoryFilter === 'all' && tripFilter === 'all') && (
              <div className="mt-6">
                <Button onClick={() => setShowEditor(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Primera Nota
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Note Editor Modal */}
        <Modal
          isOpen={showEditor}
          onClose={handleCloseEditor}
          title={editingNote ? 'Editar Nota' : 'Nueva Nota'}
          size="xl"
        >
          <NoteEditor
            note={editingNote || undefined}
            onSave={handleSaveNote}
            onCancel={handleCloseEditor}
            loading={editorLoading}
          />
        </Modal>
      </div>
    </DashboardLayout>
  )
}