# Plan de Implementación: Módulo de Gestión de Tareas

Este plan detalla los pasos para implementar un sistema de gestión de tareas (ToDo) con vista de tablero (Kanban) y calendario, permitiendo crear, editar, eliminar y mover tareas.

## 1. Base de Datos (Supabase)

Crear la tabla `tasks` en Supabase para almacenar las tareas.
*   **Archivo SQL**: `src/lib/create_tasks_table.sql`
*   **Campos**:
    *   `id` (UUID, PK)
    *   `user_id` (UUID, FK -> auth.users)
    *   `title` (TEXT)
    *   `description` (TEXT, opcional)
    *   `status` (TEXT: 'pending', 'in_progress', 'completed')
    *   `priority` (TEXT: 'low', 'medium', 'high')
    *   `due_date` (TIMESTAMPTZ, opcional)
    *   `created_at` (TIMESTAMPTZ)
    *   `updated_at` (TIMESTAMPTZ)

## 2. Tipos y Cliente Supabase

Actualizar las definiciones de tipos de TypeScript para incluir la interfaz `Task`.
*   **Archivo**: `src/lib/supabase.ts`
*   **Acción**: Añadir interface `Task`.

## 3. Backend (API Routes)

Crear endpoints para manejar las operaciones CRUD de las tareas de forma segura.
*   **Ruta**: `src/app/api/tasks/route.ts`
    *   `GET`: Obtener todas las tareas del usuario.
    *   `POST`: Crear una nueva tarea.
*   **Ruta**: `src/app/api/tasks/[id]/route.ts`
    *   `PUT`: Actualizar una tarea (estado, contenido, fecha).
    *   `DELETE`: Eliminar una tarea.

## 4. Componentes Frontend

Desarrollar componentes reutilizables para la interfaz de tareas.
*   **Ubicación**: `src/components/tasks/`
*   **Componentes**:
    *   `TaskModal.tsx`: Formulario modal para crear y editar tareas.
    *   `TaskCard.tsx`: Tarjeta individual que muestra la info de la tarea.
    *   `TaskBoard.tsx`: Tablero Kanban con columnas (Pendiente, En Progreso, Completado) y soporte para Drag & Drop simple.
    *   `TaskCalendarView.tsx`: Adaptador que utiliza el componente `Calendar` existente para mostrar tareas como eventos.

## 5. Página Principal de Tareas

Crear la página que integrará las vistas de Tablero y Calendario.
*   **Archivo**: `src/app/tasks/page.tsx`
*   **Características**:
    *   Uso de `DashboardLayout`.
    *   Selector de vista (Tablero vs Calendario).
    *   Gestión de estado local para las tareas.
    *   Integración con la API para persistencia.

## 6. Navegación

Añadir el enlace "Tareas" a la barra de navegación principal.
*   **Archivo**: `src/components/layout/DashboardLayout.tsx`
*   **Acción**: Añadir objeto `{ name: 'Tareas', href: '/tasks', icon: ClipboardDocumentListIcon }` al array de navegación.

## 7. Verificación

*   Probar la creación de tareas.
*   Probar el movimiento de tareas entre estados (Drag & Drop o botones).
*   Verificar que las tareas aparecen en el calendario en la fecha correcta.
*   Verificar la persistencia de datos al recargar.
