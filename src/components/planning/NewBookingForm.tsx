import React, { useState, useEffect } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { createSupabaseClient, Booking } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

interface NewBookingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Booking | null;
}

export default function NewBookingForm({
  onSuccess,
  onCancel,
  initialData,
}: NewBookingFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [trips, setTrips] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
      // Cargar viajes para el selector si es una nueva reserva
      if (!initialData) {
          const fetchTrips = async () => {
              try {
                  const res = await fetch('/api/trips');
                  if (res.ok) {
                      const data = await res.json();
                      setTrips(data);
                      // Preseleccionar el primer viaje si existe
                      if (data.length > 0) {
                          setFormData(prev => ({ ...prev, trip_id: data[0].id }));
                      }
                  }
              } catch (e) {
                  logger.error("Error fetching trips for selector", e);
              }
          };
          fetchTrips();
      }
  }, [initialData]);

  const [formData, setFormData] = useState({
    title: "",
    type: "other",
    start_date: new Date().toISOString().split("T")[0],
    start_time: "12:00",
    number_of_people: 1,
    description: "",
    trip_id: "",
  });

  useEffect(() => {
    if (initialData) {
      // Extract number of people from notes if possible
      let people = 1;
      let desc = initialData.description || "";
      
      if (initialData.notes) {
        const peopleMatch = initialData.notes.match(/Personas: (\d+)/);
        if (peopleMatch) {
          people = parseInt(peopleMatch[1], 10);
        }
        // Remove the "Personas: X" part from description if it was added there
        desc = initialData.notes.replace(/Personas: \d+\n?/, "").trim();
      }

      setFormData({
        title: initialData.title,
        type: initialData.type,
        start_date: initialData.start_date,
        start_time: initialData.start_time || "12:00",
        number_of_people: people,
        description: desc,
        trip_id: initialData.trip_id || "",
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createSupabaseClient();

      // Map number of people to notes/description
      const notes = `Personas: ${formData.number_of_people}\n${formData.description}`;

      // Ensure start_time is valid or null if empty
      const startTime = formData.start_time || null;

      // Usamos el ID del viaje seleccionado si existe en el contexto global (si lo tuviéramos)
      // Como este componente es genérico, debemos asegurarnos de tener un trip_id
      // NOTA: Para esta implementación rápida, asumiremos que si no hay trip_id, 
      // la API lo manejará o fallará. Lo ideal sería pasar tripId como prop.
      // Dado que initialData ya tiene trip_id, lo usamos. Si es nuevo, necesitamos un trip_id.
      // Pero el formulario actual no pide trip_id. 
      // Solución temporal: Si es una creación nueva y no tenemos trip_id, 
      // esto fallará en la API. El usuario debería seleccionar un viaje antes o en el formulario.
      // Vamos a añadir un selector de viaje si es necesario, pero por ahora 
      // mantenemos la lógica existente y asumimos que se llamará desde un contexto con viaje
      // O vamos a hacer fetch a la API sin trip_id y dejar que la API valide.
      
      const bookingData = {
        title: formData.title,
        type: formData.type,
        start_date: formData.start_date,
        start_time: startTime,
        notes: notes,
        status: initialData ? initialData.status : 'confirmed',
        // Propiedades adicionales necesarias para la API
        description: formData.description,
        // Si estamos editando, usamos el trip_id existente
        trip_id: initialData?.trip_id
      };

      logger.debug('Submitting booking data:', {
        ...bookingData,
        isUpdate: !!initialData
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('La conexión ha tardado demasiado...')), 15000)
      );

      // Si no tenemos trip_id y es creación nueva, necesitamos obtenerlo o pedirlo.
      // Por ahora, para que funcione la creación básica desde la vista de calendario global,
      // la API requerirá trip_id.
      // Si el usuario está en la vista general, no hay trip_id seleccionado.
      // Vamos a permitir que falle si falta trip_id, pero lo ideal es añadir el campo.
      
      // NOTA CRÍTICA: La API espera un trip_id. Si este formulario se usa sin un viaje preseleccionado,
      // la creación fallará. 
      // Para arreglar esto rápidamente sin cambiar toda la UI, vamos a hacer fetch a los viajes
      // y seleccionar el primero si no hay uno, o mostrar error.
      // Pero mejor aún, vamos a enviar la petición a la API.

      let url = '/api/planning'; // Usamos el mismo endpoint base o uno específico si existiera
      // Realmente deberíamos tener /api/bookings, pero por ahora usaremos /api/planning con POST
      
      // Como definimos POST en /api/planning para crear bookings:
      
      const method = 'POST'; // Siempre POST para crear en este endpoint unificado
      
      // Si estamos editando, la API debería soportar PUT o usamos otra ruta.
      // La API actual de planning solo tiene POST para crear.
      // Para editar, necesitaríamos implementar PUT.
      // Si initialData existe, estamos editando.
      
      if (initialData) {
          // TODO: Implementar PUT en API para editar
          // Por ahora lanzamos error si es edición porque no hemos hecho esa parte de la API
          // O usamos supabase directo para edición como fallback temporal?
          // No, el objetivo es quitar supabase directo.
          // Asumiremos que solo estamos arreglando CREACIÓN por ahora como pidió el usuario.
          throw new Error("La edición aún no está migrada a la nueva API.");
      }

      // Necesitamos un trip_id obligatorio.
      // Si no viene en initialData (que es null en creación), tenemos un problema.
      // Vamos a hardcodear un fetch de viajes para seleccionar uno por defecto
      // o inyectar el trip_id desde las props (que deberíamos añadir).
      
      // MOCK: Para que funcione, necesitamos que el usuario seleccione un viaje.
      // Vamos a añadir el campo de selección de viaje al formulario si no hay initialData.
      
      // ... (Lógica de selección de viaje añadida en el render) ...
      
      // Construimos el body final
      const body = {
          ...bookingData,
          // trip_id debe venir del estado del formulario (que añadiremos)
          trip_id: formData.trip_id
      };

      const fetchPromise = fetch('/api/planning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
      });

      const res = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Error al guardar la reserva');
      }

      const data = await res.json();

      logger.info(`Booking ${initialData ? 'updated' : 'created'} successfully:`, data);
      onSuccess();
    } catch (err: any) {
      logger.error('Error saving booking:', JSON.stringify(err, null, 2));
      
      let message = 'Error desconocido al guardar';
      if (err instanceof Error) {
        message = err.message;
      }
      
      setError(`Error al guardar la reserva: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="Título *"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ej: Cena en Restaurante X"
          required
        />
      </div>

      {!initialData && (
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  Viaje Asociado *
              </label>
              <select
                  name="trip_id"
                  value={formData.trip_id}
                  onChange={handleChange}
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              >
                  <option value="">Selecciona un viaje</option>
                  {trips.map(trip => (
                      <option key={trip.id} value={trip.id}>{trip.title}</option>
                  ))}
              </select>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="type-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tipo
          </label>
          <select
            id="type-select"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="flight">Vuelo</option>
            <option value="hotel">Hotel</option>
            <option value="car">Coche</option>
            <option value="restaurant">Restaurante</option>
            <option value="activity">Actividad</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <Input
            label="Nº Personas"
            type="number"
            name="number_of_people"
            value={formData.number_of_people}
            onChange={handleChange}
            min={1}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Fecha *"
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Input
            label="Hora"
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Reserva"}
        </Button>
      </div>
    </form>
  );
}
