'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CTA() {
  return (
    <div className="bg-accent">
      <div className="mx-auto max-w-7xl px-6 py-section-lg lg:px-8">
        <div className="max-w-2xl">
          <motion.h2
            className="font-serif text-title leading-tight text-on-accent sm:text-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            ¿Listo para tu próxima aventura?
            <br />
            Empieza a usar TravelPal hoy mismo.
          </motion.h2>
          <motion.p
            className="mt-6 max-w-prose text-lg leading-reading text-on-accent/80"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Únete a nuestra comunidad de viajeros y descubre la forma más fácil de planificar y disfrutar tus viajes.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link
              href="/signup"
              className="rounded-md bg-paper px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
            >
              Regístrate gratis
            </Link>
            <Link
              href="/signin"
              className="text-sm font-semibold leading-6 text-on-accent hover:opacity-80"
            >
              Iniciar Sesión <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
