# PRD: Gestión de Vuelos (App de Viajes)

## Resumen
- Propósito: gestionar viajes, reservas, planificación diaria, gastos, presupuesto, notas y alertas con autenticación y experiencia web responsive.
- Público: viajeros frecuentes, equipos internos y usuarios que requieren trazabilidad y recordatorios.
- Plataformas: Web (Next.js App Router), cliente y servidor usando Supabase.

## Objetivos
- Centralizar la información de viajes y reservas en un único dashboard.
- Facilitar planificación de itinerarios por día con actividades y recordatorios.
- Registrar gastos y controlar presupuesto por viaje.
- Mejorar la productividad con notas y alertas (recordatorios/avisos).
- Proveer una UI consistente, accesible y rápida.

## Alcance (MVP actual)
- Autenticación: registro, login/logout, recuperación de contraseña.
- Dashboard: resumen de próximos viajes/actividades/alertas.
- Viajes: listado, creación y edición básica.
- Planificación: actividades por fecha (itinerario) y reservas vinculadas.
- Gastos: listado, creación, categorías, moneda.
- Presupuesto: visualización y análisis simple.
- Notas: CRUD por viaje y generales.
- Alertas: recordatorios y avisos; panel de notificaciones.

## Flujo de Usuario
- Visitante sin sesión:
  - Accede a `/auth/login` y puede registrarse en `/auth/register`.
  - Recuperación de contraseña en `/auth/forgot-password`.
- Usuario autenticado:
  - Es redirigido a `/dashboard`.
  - Navega con Navbar a módulos: `Dashboard`, `Viajes`, `Planificación`, `Gastos`, `Presupuesto`, `Análisis`, `Notas`, `Alertas`.
  - Menú de perfil: ver perfil y cerrar sesión.
  - Notificaciones: panel desplegable, contador de no leídas y acciones (marcar/desechar).

## Requisitos Funcionales
- Autenticación
  - `signUp(email, password, fullName)` crea usuario.
  - `signIn(email, password)` autentica y establece sesión.
  - `signOut()` cierra sesión.
  - `resetPassword(email)` envía enlace de recuperación.
  - `updateProfile({ full_name?, avatar_url? })` actualiza perfil.
- Viajes (`/trips`)
  - Crear, listar, editar campos: título, origen, destino, fechas, estado, notas.
  - Filtrar/ordenar por fechas/estado.
- Planificación (`/planning`)
  - Actividades por día con título, descripción, horas, ubicación y orden.
  - Reservas: vuelo/hotel/coche/actividad con estado y fechas.
  - Recordatorios de reservas y actividades.
- Gastos (`/expenses`)
  - Registrar gastos con título, monto, moneda, categoría y fecha.
  - Listar por viaje y totales.
- Presupuesto (`/budget`)
  - Agregados de gastos por categoría, gráficos básicos.
- Notas (`/notes`)
  - CRUD de notas con etiquetas y favorito.
- Alertas (`/alerts`)
  - Panel para ver, marcar como leídas y descartar alertas.

## Requisitos No Funcionales
- Rendimiento: navegación rápida; medir con utilitario de rendimiento.
- Accesibilidad: navegación por teclado, foco visible y roles adecuados.
- Seguridad: autenticación vía Supabase; protección de rutas con `ProtectedRoute`.
- Observabilidad: logger centralizado con niveles (debug, info, warn, error) controlado por `NEXT_PUBLIC_LOG_LEVEL`.

## Arquitectura y Datos
- Frontend: Next.js (App Router), React, Tailwind.
- Backend: Supabase (auth, Postgres, `@supabase/ssr` para cliente).
- Modelos principales (tablas): `users`, `trips`, `bookings`, `itinerary_activities`, `expenses`, `notes`, `alerts`, `calendar_events`.
- Cliente Supabase: `src/lib/supabase.ts` y funciones en `src/lib/supabase-functions.ts`.

## Navegación y UI
- `Navbar.tsx`: enlaces, notificaciones, botón “Nuevo Viaje” y menú de perfil con avatar (fallback si falla imagen).
- Notificaciones: `NotificationSystem` con `BellIcon`, contador y panel (marcar/desechar).
- Formularios: validación con `react-hook-form` + `zod`.
- Componentes comunes: botones, inputs, cards; Tailwind para estilos.

## Entornos y Configuración
- Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_LOG_LEVEL`.
- Desarrollo: servidor en `http://localhost:3000`.

## Casos de Prueba Clave (para Testsprite)
- Auth
  - Registro exitoso y login.
  - Login inválido muestra error.
  - Logout redirige a `/auth/login`.
  - Recuperar contraseña valida email y muestra confirmación.
- Navbar y Navegación
  - Menú de perfil abre/cierra; avatar fallback visible.
  - Botón “Nuevo Viaje” navega a `/trips/new`.
  - Notificaciones muestran contador y panel; marcar/desechar funciona.
- Planificación
  - Lista actividades por fecha y permite marcar completadas.
  - Reservas se cargan y ordenan por fecha.
- Gastos/Presupuesto
  - Crear gasto y mostrar en listado.
  - Totales/agrupaciones se ven en presupuesto.
- Notas
  - Crear, editar y borrar nota; marcar favorita.

## Métricas y Logging
- Nivel de log configurable: `debug|info|warn|error`.
- Métricas de rendimiento visibles solo si el nivel lo permite.

## Riesgos y Suposiciones
- Supabase keys válidas en `.env.local`.
- Datos iniciales pueden faltar; UI debe manejar vacíos.
- Avatar externo puede fallar; se muestra icono genérico.

## Futuro (Opcional)
- Migración visual a Shadcn UI (Avatar, DropdownMenu, Toast, Dialog, Table).
- Internacionalización y exportación de informes.