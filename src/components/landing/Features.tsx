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
    <div className="bg-background py-section-lg" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Todo en uno
          </h2>
          <p className="mt-3 font-serif text-title text-ink sm:text-display">
            Todo lo que necesitas para tu próximo viaje
          </p>
          <p className="mt-6 max-w-prose text-lg leading-reading text-muted">
            TravelPal simplifica la planificación y gestión de tus viajes para que puedas concentrarte en disfrutar la experiencia.
          </p>
        </div>
        <div className="mt-16 max-w-2xl sm:mt-20 lg:max-w-none">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                className="border-t border-line pt-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <feature.icon className="h-6 w-6 text-accent" aria-hidden="true" />
                <dt className="mt-4 font-serif text-heading leading-snug text-ink">
                  {feature.name}
                </dt>
                <dd className="mt-2 max-w-prose leading-reading text-muted">
                  {feature.description}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
