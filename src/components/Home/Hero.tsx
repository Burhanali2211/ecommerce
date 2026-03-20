import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&q=75&auto=format',
    title: 'Premium Kashmiri Saffron',
    subtitle: 'Up to 30% off — Limited time',
    cta: 'Shop Now',
    ctaLink: '/products?category=saffron',
    accent: 'from-amber-900/80 to-transparent',
  },
  {
    image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=1200&q=75&auto=format',
    title: 'Organic Spice Collections',
    subtitle: 'Sourced directly from Himalayan farmers',
    cta: 'Explore',
    ctaLink: '/products',
    accent: 'from-green-900/80 to-transparent',
  },
  {
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=75&auto=format',
    title: 'Artisan Gift Sets',
    subtitle: 'Perfect for every occasion',
    cta: 'View Gifts',
    ctaLink: '/collections',
    accent: 'from-stone-900/80 to-transparent',
  },
];

export const Hero: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (transitioning || index === current) return;
    setTransitioning(true);
    setCurrent(index);
    setTimeout(() => setTransitioning(false), 400);
  }, [current, transitioning]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="relative w-full h-[260px] sm:h-[320px] md:h-[400px] lg:h-[440px] overflow-hidden bg-gray-100">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-[400ms] ${i === current ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={i !== current}
        >
          <img
            src={slide.image}
            alt={slide.title}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            width={1200}
            height={400}
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`} />
          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="px-4 sm:px-8 md:px-12 max-w-lg">
              <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">{slide.subtitle}</p>
              <h2 className="text-white text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3 drop-shadow-sm">
                {slide.title}
              </h2>
              <Link
                to={slide.ctaLink}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-colors"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button onClick={prev} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all" aria-label="Previous">
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button onClick={next} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all" aria-label="Next">
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 sm:w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
