-- Script de corrección para Políticas de Seguridad (RLS) en la tabla 'bookings'
-- Ejecuta este script en el Editor SQL de Supabase para solucionar el error de permisos.

-- 1. Asegurar que RLS está habilitado
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos o duplicados
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

-- 3. Crear políticas explícitas y permisivas para el propietario

-- SELECT: Permitir ver sus propias reservas
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Permitir insertar reservas asignadas a sí mismo
-- Esta es la política crítica que estaba fallando
CREATE POLICY "Users can insert their own bookings" ON bookings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Permitir actualizar sus propias reservas
CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: Permitir eliminar sus propias reservas
CREATE POLICY "Users can delete their own bookings" ON bookings
    FOR DELETE
    USING (auth.uid() = user_id);
