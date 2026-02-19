'use client';

import { motion } from 'framer-motion';
import { 
  MapIcon, 
  CurrencyDollarIcon, 
  ClipboardDocumentListIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Planificación de Viajes',
    description: 'Crea y gestiona tus viajes de forma sencilla. Organiza destinos, fechas y detalles importantes en un solo lugar.',
    icon: MapIcon,
  },
  {
    name: 'Gestión de Gastos',
    description: 'Lleva un control detallado de tus gastos. Categoriza tus compras y mantén tu presupuesto bajo control.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Itinerarios Detallados',
    description: 'Planifica tu día a día con itinerarios flexibles. Agrega actividades, reservas y notas importantes.',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: 'Análisis y Reportes',
    description: 'Visualiza tus gastos con gráficos intuitivos. Entiende en qué estás gastando y optimiza tu presupuesto.',
    icon: ChartBarIcon,
  },
];

export default function Features() {
  return (
    <div className="bg-white py-24 sm:py-32" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Todo en uno</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Todo lo que necesitas para tu próximo viaje
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            TravelPal simplifica la planificación y gestión de tus viajes para que puedas concentrarte en disfrutar la experiencia.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.name} 
                className="relative pl-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
