import { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'TravelPal - Tu compañero de viaje perfecto',
  description: 'Planifica, organiza y disfruta tus aventuras sin estrés. Todo lo que necesitas en un solo lugar.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
