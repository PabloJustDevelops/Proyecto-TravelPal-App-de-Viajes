import { cn } from '@/lib/utils'

/**
 * Clase canonica de los campos de formulario (input, select y textarea).
 * Cualquier campo nuevo debe usarla en vez de reescribir el estilo a mano.
 *
 * El campo se apoya en el papel (no en la superficie de la lamina que lo contiene) para
 * separarse de ella sin necesidad de borde grueso ni sombra.
 */
export const fieldClassName =
  'w-full h-10 px-3 py-2 text-sm rounded-md border border-line bg-paper text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent disabled:cursor-not-allowed disabled:opacity-50'

/** Variante para <textarea>: mismo estilo, altura libre. */
export const textareaClassName = cn(fieldClassName, 'h-auto min-h-[5rem] resize-y')

/** Variante para <select>: mismo estilo, alto fijo. */
export const selectClassName = fieldClassName
