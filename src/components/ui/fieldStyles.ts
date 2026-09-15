import { cn } from '@/lib/utils'

/**
 * Clase canonica de los campos de formulario (input, select y textarea).
 * Cualquier campo nuevo debe usarla en vez de reescribir el estilo a mano.
 */
export const fieldClassName =
  'w-full h-10 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50'

/** Variante para <textarea>: mismo estilo, altura libre. */
export const textareaClassName = cn(fieldClassName, 'h-auto min-h-[5rem] resize-y')

/** Variante para <select>: mismo estilo, alto fijo. */
export const selectClassName = fieldClassName
