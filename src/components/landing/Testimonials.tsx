'use client';

import { motion } from 'framer-motion';

const testimonials = [
  {
    body: 'TravelPal ha transformado la forma en que planeo mis viajes. Ahora puedo relajarme sabiendo que todo está organizado.',
    author: {
      name: 'Ana García',
      handle: '@anagarcia',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    body: 'La gestión de gastos es impecable. Pude mantener mi presupuesto bajo control durante todo mi viaje por Europa.',
    author: {
      name: 'Carlos Rodríguez',
      handle: '@carlosrod',
      imageUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    body: 'Una herramienta esencial para cualquier viajero. La interfaz es intuitiva y fácil de usar.',
    author: {
      name: 'María López',
      handle: '@marialopez',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
];

export default function Testimonials() {
  return (
    <div className="bg-background py-section-lg" id="testimonials">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Testimonios
          </h2>
          <p className="mt-3 font-serif text-title text-ink sm:text-display">
            Lo que dicen nuestros viajeros
          </p>
        </div>
        <div className="mt-16 sm:mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author.handle}
                className="bg-surface p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <blockquote className="font-serif text-heading leading-reading text-ink">
                  <p>“{testimonial.body}”</p>
                </blockquote>
                <div className="mt-6 flex items-center gap-x-4">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={testimonial.author.imageUrl}
                    alt=""
                  />
                  <div>
                    <div className="font-semibold text-ink">{testimonial.author.name}</div>
                    <div className="text-sm text-muted">{testimonial.author.handle}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
