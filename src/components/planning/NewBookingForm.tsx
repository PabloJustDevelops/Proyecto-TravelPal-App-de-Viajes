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

  const [formData, setFormData] = useState({
    title: "",
    type: "other",
    start_date: new Date().toISOString().split("T")[0],
    start_time: "12:00",
    number_of_people: 1,
    description: "",
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

      const bookingData = {
        user_id: user.id,
        title: formData.title,
        type: formData.type,
        start_date: formData.start_date,
        start_time: startTime,
        notes: notes,
        status: initialData ? initialData.status : 'confirmed',
      };

      logger.debug('Submitting booking data:', {
        ...bookingData,
        user_id_check: user.id,
        isUpdate: !!initialData
      });

      // Usamos Promise.race para competir entre la DB y el timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('La conexión ha tardado demasiado...')), 15000)
      );

      let dbPromise;
      if (initialData) {
        dbPromise = supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', initialData.id)
          .select();
      } else {
        dbPromise = supabase
          .from('bookings')
          .insert([bookingData])
          .select();
      }

      const { data, error: opError } = (await Promise.race([
        dbPromise,
        timeoutPromise,
      ])) as any;

      if (opError) throw opError;

      logger.info(`Booking ${initialData ? 'updated' : 'created'} successfully:`, data);
      onSuccess();
    } catch (err: any) {
      logger.error('Error saving booking:', JSON.stringify(err, null, 2));
      
      let message = 'Error desconocido al guardar';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Intentar extraer mensaje de error de Supabase/Postgres
        message = err.message || err.details || err.hint || JSON.stringify(err);
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
