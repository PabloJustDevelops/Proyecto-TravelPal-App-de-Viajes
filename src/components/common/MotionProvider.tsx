'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Hace que framer-motion respete la preferencia de movimiento reducido del sistema.
 * Sin esto, las animaciones ignoran `prefers-reduced-motion` aunque el CSS si lo respete.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
