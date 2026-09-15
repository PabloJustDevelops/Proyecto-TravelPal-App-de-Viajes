/**
 * Clase canonica de la accion primaria del rumbo. El boton del sistema la usa tal cual y los
 * enlaces que actuan como boton (la landing, el CTA) la extienden con su propia geometria, de
 * forma que el acento se declara en un solo sitio y no se copia por las pantallas.
 */
export const accentActionClassName = 'bg-accent text-on-accent hover:bg-accent-hover'

/** Enlace con la forma del boton primario: misma accion, disparada desde un <a>. */
export const accentLinkClassName = `inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${accentActionClassName}`
