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
    <div className="bg-gray-50 py-24 sm:py-32" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Simplicidad</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Cómo funciona TravelPal
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            En solo unos pocos pasos estarás listo para despegar.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-4 lg:gap-x-8">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id} 
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 mb-6">
                  {step.id}
                </div>
                <h3 className="text-lg font-semibold leading-8 text-gray-900">{step.title}</h3>
                <p className="mt-2 text-base leading-7 text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
