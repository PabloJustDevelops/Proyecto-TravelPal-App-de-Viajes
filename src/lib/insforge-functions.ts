import { createInsforgeClient } from './insforge';

export interface Booking {
  id: string;
  user_id: string;
  trip_id?: string;
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'restaurant' | 'other';
  title: string;
  description?: string;
  confirmation_number?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  cost?: number;
  currency?: string;
  notes?: string;
  documents?: string[];
  created_at: string;
  updated_at: string;
}

export interface ItineraryActivity {
  id: string;
  user_id: string;
  trip_id: string;
  date: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  category?: string;
  cost?: number;
  currency?: string;
  notes?: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  booking_id?: string;
  trip_id?: string;
  title: string;
  message: string;
  reminder_datetime: string;
  type: 'booking' | 'activity' | 'general' | 'document' | 'payment';
  status: 'pending' | 'sent' | 'dismissed';
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  trip_id?: string;
  booking_id?: string;
  activity_id?: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  type: 'trip' | 'booking' | 'activity' | 'reminder' | 'custom';
  color?: string;
  all_day: boolean;
  created_at: string;
  updated_at: string;
}

// Funciones para Bookings
export const bookingFunctions = {
  // Obtener todas las reservas del usuario
  async getAll(userId: string): Promise<Booking[]> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener reservas por viaje
  async getByTrip(userId: string, tripId: string): Promise<Booking[]> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear nueva reserva
  async create(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar reserva
  async update(id: string, updates: Partial<Booking>): Promise<Booking> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar reserva
  async delete(id: string): Promise<void> {
    const insforge = createInsforgeClient();
    const { error } = await insforge
      .database.from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Obtener próximas reservas
  async getUpcoming(userId: string, limit: number = 5): Promise<Booking[]> {
    const insforge = createInsforgeClient();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await insforge
      .database.from('bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};

// Funciones para Actividades del Itinerario
export const activityFunctions = {
  // Obtener actividades por viaje
  async getByTrip(userId: string, tripId: string): Promise<ItineraryActivity[]> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('itinerary_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .order('date', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener actividades por fecha
  async getByDate(userId: string, tripId: string, date: string): Promise<ItineraryActivity[]> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('itinerary_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .eq('date', date)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear nueva actividad
  async create(activity: Omit<ItineraryActivity, 'id' | 'created_at' | 'updated_at'>): Promise<ItineraryActivity> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('itinerary_activities')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar actividad
  async update(id: string, updates: Partial<ItineraryActivity>): Promise<ItineraryActivity> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('itinerary_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar actividad
  async delete(id: string): Promise<void> {
    const insforge = createInsforgeClient();
    const { error } = await insforge
      .database.from('itinerary_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Reordenar actividades
  async reorder(activities: { id: string; order_index: number }[]): Promise<void> {
    const insforge = createInsforgeClient();
    
    for (const activity of activities) {
      const { error } = await insforge
        .database.from('itinerary_activities')
        .update({ order_index: activity.order_index })
        .eq('id', activity.id);

      if (error) throw error;
    }
  }
};

// Funciones para Recordatorios
export const reminderFunctions = {
  // Obtener recordatorios del usuario
  async getAll(userId: string): Promise<Reminder[]> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('reminder_datetime', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener recordatorios pendientes
  async getPending(userId: string): Promise<Reminder[]> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('reminder_datetime', new Date().toISOString())
      .order('reminder_datetime', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear recordatorio
  async create(reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('reminders')
      .insert(reminder)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Marcar recordatorio como enviado
  async markAsSent(id: string): Promise<void> {
    const insforge = createInsforgeClient();
    const { error } = await insforge
      .database.from('reminders')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
  },

  // Descartar recordatorio
  async dismiss(id: string): Promise<void> {
    const insforge = createInsforgeClient();
    const { error } = await insforge
      .database.from('reminders')
      .update({ status: 'dismissed' })
      .eq('id', id);

    if (error) throw error;
  }
};

// Funciones para Eventos del Calendario
export const calendarFunctions = {
  // Obtener eventos del mes
  async getByMonth(userId: string, year: number, month: number): Promise<CalendarEvent[]> {
    const insforge = createInsforgeClient();
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await insforge
      .database.from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener eventos por fecha
  async getByDate(userId: string, date: string): Promise<CalendarEvent[]> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_date', date)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear evento
  async create(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const insforge = createInsforgeClient();
    const { data, error } = await insforge
      .database.from('calendar_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Sincronizar eventos automáticamente desde reservas y actividades
  async syncEvents(userId: string): Promise<void> {
    const insforge = createInsforgeClient();

    // Eliminar eventos automáticos existentes
    await insforge
      .database.from('calendar_events')
      .delete()
      .eq('user_id', userId)
      .in('type', ['booking', 'activity']);

    // Crear eventos desde reservas
    const bookings = await bookingFunctions.getAll(userId);
    for (const booking of bookings) {
      await calendarFunctions.create({
        user_id: userId,
        booking_id: booking.id,
        trip_id: booking.trip_id,
        title: booking.title,
        description: booking.description,
        event_date: booking.start_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        type: 'booking',
        color: booking.status === 'confirmed' ? 'green' : 
               booking.status === 'pending' ? 'yellow' : 'red',
        all_day: !booking.start_time
      });
    }

    // Crear eventos desde actividades
    const activities = await insforge
      .database.from('itinerary_activities')
      .select('*')
      .eq('user_id', userId);

    if (activities.data) {
      for (const activity of activities.data) {
        await calendarFunctions.create({
          user_id: userId,
          activity_id: activity.id,
          trip_id: activity.trip_id,
          title: activity.title,
          description: activity.description,
          event_date: activity.date,
          start_time: activity.start_time,
          end_time: activity.end_time,
          type: 'activity',
          color: 'blue',
          all_day: !activity.start_time
        });
      }
    }
  }
};

// Función de utilidad para generar recordatorios automáticos
export const generateAutoReminders = async (userId: string, booking: Booking): Promise<void> => {
  const reminders: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>[] = [];

  // Recordatorio 24 horas antes para vuelos
  if (booking.type === 'flight') {
    const reminderDate = new Date(booking.start_date);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    reminders.push({
      user_id: userId,
      booking_id: booking.id,
      trip_id: booking.trip_id,
      title: 'Check-in disponible',
      message: `Recuerda hacer el check-in online para tu vuelo ${booking.title}`,
      reminder_datetime: reminderDate.toISOString(),
      type: 'booking',
      status: 'pending'
    });
  }

  // Recordatorio 2 horas antes para actividades
  if (booking.type === 'activity' && booking.start_time) {
    const reminderDate = new Date(`${booking.start_date}T${booking.start_time}`);
    reminderDate.setHours(reminderDate.getHours() - 2);
    
    reminders.push({
      user_id: userId,
      booking_id: booking.id,
      trip_id: booking.trip_id,
      title: 'Actividad próxima',
      message: `Tu actividad ${booking.title} comienza en 2 horas`,
      reminder_datetime: reminderDate.toISOString(),
      type: 'booking',
      status: 'pending'
    });
  }

  // Crear los recordatorios
  for (const reminder of reminders) {
    await reminderFunctions.create(reminder);
  }
};