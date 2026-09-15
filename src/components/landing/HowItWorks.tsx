'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    id: 1,
    title: 'Crea tu cuenta',
    description: 'Regístrate en segundos y comienza a planificar tu próxima aventura.',
  },
  {
    id: 2,
    title: 'Organiza tu viaje',
    description: 'Añade destinos, fechas y detalles clave de tu itinerario.',
  },
  {
    id: 3,
    title: 'Gestiona tus gastos',
    description: 'Lleva un control de tu presupuesto y categorías de gastos.',
  },
  {
    id: 4,
    title: '¡Disfruta!',
    description: 'Relájate y disfruta sabiendo que todo está bajo control.',
  },
];

export default function HowItWorks() {
  return (
    <div className="bg-surface py-section-lg" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Simplicidad
          </h2>
          <p className="mt-3 font-serif text-title text-ink sm:text-display">
            Cómo funciona TravelPal
          </p>
          <p className="mt-6 max-w-prose text-lg leading-reading text-muted">
            En solo unos pocos pasos estarás listo para despegar.
          </p>
        </div>
        <div className="mt-16 sm:mt-20">
          <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className="border-t border-line pt-6"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="font-serif text-2xl text-accent">{step.id}</div>
                <h3 className="mt-4 font-serif text-heading leading-snug text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-prose leading-reading text-muted">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
