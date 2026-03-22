import React from 'react';
import { MapPin, Award, Clock, Users, Leaf, Heart, Droplets, Globe, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';

export const AboutPage: React.FC = () => {
  const { settings } = useSettings();
  const { contactInfo, businessHours } = settings;

  const addressContact = contactInfo.find(c => c.contact_type === 'address' && c.is_primary) ||
                         contactInfo.find(c => c.contact_type === 'address');
  const address = addressContact?.value || 'Aligarh, Uttar Pradesh, India';

  const formatBusinessHours = () => {
    if (!businessHours || businessHours.length === 0) {
      return 'Monday - Saturday: 9:00 AM - 7:00 PM';
    }
    const openDays = businessHours.filter(bh => bh.is_open);
    if (openDays.length === 7) {
      const firstDay = businessHours.find(bh => bh.is_open);
      if (firstDay?.is_24_hours) return 'Open 24/7';
      if (firstDay?.open_time && firstDay?.close_time) {
        return `Monday - Sunday: ${firstDay.open_time} - ${firstDay.close_time}`;
      }
    }
    return 'Monday - Saturday: 9:00 AM - 7:00 PM';
  };

  const hours = formatBusinessHours();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=1600&q=80')] bg-cover bg-center opacity-10" />
        {/* subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Aligarh Attar House
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-gray-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Pure Attars & Islamic Lifestyle Products — Crafted with Tradition
            </motion.p>
            <motion.div
              className="flex items-center justify-center text-gray-400 text-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <MapPin className="mr-2 h-5 w-5" />
              <span>{address}</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Our Story ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Founded in the heart of Aligarh — India's attar capital — Aligarh Attar House has been
                dedicated to preserving and sharing the ancient art of pure fragrance. Our journey began
                with a simple passion: to bring the world's finest alcohol-free attars and perfumes to
                those who appreciate authenticity, tradition, and quality.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Aligarh has been the epicentre of India's attar industry for centuries, celebrated for
                its master perfumers (attarwalas) who craft pure concentrates using the traditional
                deg-bhapka method — a steam distillation process that preserves every nuance of the
                natural ingredient. We work directly with these artisans to bring their craft to your doorstep.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Beyond fragrance, we are proud to offer a thoughtfully curated range of Islamic lifestyle
                products — beautiful hijabs, Quranic books, modest kids' clothing, and educational toys —
                making us a one-stop destination for the Muslim household.
              </p>
            </motion.div>

            <motion.div className="relative" variants={itemVariants}>
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800&q=80"
                  alt="Pure attars from Aligarh"
                  crossOrigin="anonymous"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-gray-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-8 w-8 text-amber-400" />
                  <div>
                    <p className="text-2xl font-bold">50+</p>
                    <p className="text-sm text-gray-300">Countries Served</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Aligarh Attar House?
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              We bring you the finest attars and Islamic lifestyle products, sourced directly from Aligarh's master artisans
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: Droplets, title: 'Pure & Alcohol-Free', text: 'All our attars are 100% alcohol-free, made using the traditional deg-bhapka steam distillation — halal, natural, and free from synthetic additives.' },
              { icon: Leaf, title: 'Direct from Artisans', text: 'We work directly with Aligarh\'s master perfumers (attarwalas), cutting out middlemen to bring you authentic fragrances at honest prices.' },
              { icon: Award, title: 'Quality Guaranteed', text: 'Every product is carefully selected for quality, longevity, and authenticity. We stand behind every bottle with our full satisfaction guarantee.' },
            ].map(({ icon: Icon, title, text }) => (
              <motion.div
                key={title}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow duration-300"
                variants={itemVariants}
              >
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Icon className="h-7 w-7 text-amber-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Premium Collection ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="order-2 lg:order-1" variants={itemVariants}>
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80"
                  alt="Premium attars and perfumes"
                  crossOrigin="anonymous"
                  className="w-full h-96 object-cover"
                />
              </div>
            </motion.div>

            <motion.div className="order-1 lg:order-2" variants={itemVariants}>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Premium Collection
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                From traditional rose attars and Shamama to rich oud, floral perfumes, hijabs, Islamic books,
                modest kids' clothing and educational toys — we offer a curated selection of everything
                a Muslim household needs.
              </p>
              <ul className="space-y-4">
                {[
                  ['Attars & Perfumes', 'Alcohol-free, long-lasting fragrances'],
                  ['Oud & Bakhoor', 'Rich agarwood for home & gifting'],
                  ['Hijabs & Modest Wear', 'Chiffon, jersey, silk & more'],
                  ['Islamic Books', 'Quran, duas, and children\'s titles'],
                  ['Kids Clothes & Toys', 'Modest, educational and fun'],
                  ['Gift Sets', 'Curated for Eid, Nikah & celebrations'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex items-center gap-3 text-gray-700">
                    <span className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0" />
                    <span><strong className="text-gray-900">{title}</strong> — {desc}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Principles that guide everything we do
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { title: 'Authenticity', text: 'Every attar is 100% pure and traceable to its master perfumer in Aligarh.' },
              { title: 'Halal', text: 'All our fragrances are alcohol-free and permissible — crafted for the conscious Muslim consumer.' },
              { title: 'Community', text: 'We support local artisans and attar craftsmen, preserving a centuries-old tradition.' },
              { title: 'Excellence', text: 'Unwavering commitment to quality in every product — from fragrance to packaging.' },
            ].map(({ title, text }) => (
              <motion.div
                key={title}
                className="bg-white/5 p-6 rounded-xl border border-white/10"
                variants={itemVariants}
              >
                <h3 className="text-lg font-bold mb-3 text-amber-400">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Shipping & Contact ── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Worldwide Shipping
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              From Aligarh to your doorstep — we deliver across India and internationally
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-full">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h3>
                <div className="space-y-5">
                  {[
                    { icon: MapPin, label: 'Headquarters', value: address },
                    { icon: Clock, label: 'Business Hours', value: hours },
                    { icon: Truck, label: 'Shipping', value: 'All India delivery · International shipping available' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{label}</p>
                        <p className="text-gray-500 text-sm mt-0.5 whitespace-pre-line">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-2">Bulk Orders & Inquiries</h4>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                    We offer special pricing for bulk orders and welcome inquiries from retailers,
                    gift shops, and businesses looking for premium attars and Islamic lifestyle products.
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-96 lg:h-auto" variants={itemVariants}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56904.14226041853!2d78.02665115!3d27.8973572!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3974a58d3034cfe5%3A0xe5c13cde61a95e9a!2sAligarh%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1705000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                title="Aligarh Attar House Location"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
