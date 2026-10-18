import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Pricing from '@/components/Pricing';
import Specialists from '@/components/Specialists';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      {/* Sticky Top Glass Navbar */}
      <Navbar />

      {/* Main Page Layout */}
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />

        {/* About Section */}
        <About />

        {/* Services Section */}
        <Services />

        {/* Pricing Packages Section */}
        <Pricing />

        {/* Specialists Team Section */}
        <Specialists />

        {/* Gallery Masonry Section */}
        <Gallery />

        {/* Testimonials Review Slider */}
        <Testimonials />

        {/* FAQ Accordion Section */}
        <FAQ />

        {/* Contact info, Map & Multi-step Booking Form */}
        <Contact />
      </main>

      {/* Footer Section */}
      <Footer />
    </>
  );
}
