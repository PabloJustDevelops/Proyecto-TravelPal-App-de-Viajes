-- Tabla para reservas de viajes
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('flight', 'hotel', 'car', 'activity', 'restaurant', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  confirmation_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  address TEXT,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  cost DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para actividades del itinerario
CREATE TABLE IF NOT EXISTS itinerary_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  address TEXT,
  category VARCHAR(50) DEFAULT 'general',
  cost DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para recordatorios
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reminder_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('booking', 'activity', 'general', 'document', 'payment')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para eventos del calendario
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES itinerary_activities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  type VARCHAR(20) NOT NULL CHECK (type IN ('trip', 'booking', 'activity', 'reminder', 'custom')),
  color VARCHAR(20) DEFAULT 'blue',
  all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para notas de viaje
CREATE TABLE IF NOT EXISTS trip_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  category VARCHAR(50) DEFAULT 'general',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Tabla para Tareas (Tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_itinerary_activities_user_id ON itinerary_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_trip_id ON itinerary_activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_date ON itinerary_activities(date);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_datetime ON reminders(reminder_datetime);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_activities_updated_at BEFORE UPDATE ON itinerary_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Políticas para bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
CREATE POLICY "Users can insert their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
CREATE POLICY "Users can delete their own bookings" ON bookings
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para itinerary_activities
CREATE POLICY "Users can view their own activities" ON itinerary_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON itinerary_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON itinerary_activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON itinerary_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reminders
CREATE POLICY "Users can view their own reminders" ON reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" ON reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para calendar_events
CREATE POLICY "Users can view their own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles
    FOR UPDATE USING (auth.uid() = id);
