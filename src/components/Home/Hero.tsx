import React, { useState, useEffect } from 'react';
import { ArrowRight, Truck, Shield, Leaf, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
  // Beautiful spice/himalayan images
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
      subtitle: 'From the Heart of Kashmir',
      title: 'Premium Saffron',
      highlight: '& Exotic Spices',
      description: 'Experience the world\'s finest saffron, hand-picked from the valleys of Kashmir. Each strand carries centuries of tradition.',
    },
    {
      image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=1600&q=80',
      subtitle: 'Nature\'s Purest Flavors',
      title: 'Organic Spice',
      highlight: 'Collections',
      description: 'Discover our curated collection of organic spices, sourced directly from Himalayan farmers who practice sustainable agriculture.',
    },
    {
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
      subtitle: 'Handcrafted with Love',
      title: 'Artisan Blends',
      highlight: '& Gift Sets',
      description: 'Perfect for gifting or elevating your own kitchen. Our master blenders create unique combinations you won\'t find anywhere else.',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        nextSlide();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [currentSlide, isTransitioning]);

  // Preload images
  useEffect(() => {
    slides.forEach((slide, index) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(index));
        if (index === 0) setIsLoaded(true);
      };
      img.src = slide.image;
    });
  }, []);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goToSlide = (index: number) => {
    if (index !== currentSlide && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 600);
    }
  };

  const current = slides[currentSlide];

  return (
    <section className="relative min-h-[100svh] flex flex-col">
      {/* Background with Parallax Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${slide.image}')` }}
            />
          </div>
        ))}
        
        {/* Gradient Overlays - Creates depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        {/* Warm color tint */}
        <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center pt-24 pb-8 md:pt-28 md:pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              {/* Subtitle Badge */}
              <div 
                className={`inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full transition-all duration-500 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Leaf className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-white/90">{current.subtitle}</span>
              </div>

              {/* Main Heading */}
              <h1 
                className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] transition-all duration-500 delay-100 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <span className="block">{current.title}</span>
                <span className="block text-amber-400">{current.highlight}</span>
              </h1>

              {/* Description */}
              <p 
                className={`text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed transition-all duration-500 delay-200 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {current.description}
              </p>

              {/* CTA Buttons */}
              <div 
                className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8 transition-all duration-500 delay-300 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Link
                  to="/products"
                  className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-8 sm:py-4 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98] text-sm sm:text-base"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-8 sm:py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 transition-all duration-300 active:scale-[0.98] text-sm sm:text-base"
                >
                  <span>Our Story</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div 
                className={`flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-white/70 transition-all duration-500 delay-[400ms] ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-400" />
                  <span>Free Shipping 999+</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span>100% Authentic</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span>4.9/5 Rating</span>
                </div>
              </div>
            </div>

            {/* Right: Featured Bestseller Card (Desktop) */}
            <div 
              className={`hidden lg:block transition-all duration-500 delay-300 ${
                isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              <Link to="/products" className="group block">
                <div className="relative bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.35)] transition-all duration-500 hover:-translate-y-1">
                  {/* Premium accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500" />
                  
                  <div className="flex flex-col sm:flex-row">
                    {/* Product Image - Clean showcase */}
                    <div className="flex-1 min-h-[220px] bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=85"
                        alt="Premium Kashmiri Saffron"
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold tracking-widest rounded-md shadow-sm">
                          <Star className="h-3 w-3 fill-white" />
                          BESTSELLER
                        </span>
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                          ))}
                          <span className="text-xs text-gray-500 ml-1 font-medium">(2.4k reviews)</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">Premium Kashmiri Saffron</h3>
                        <p className="text-gray-500 text-sm leading-snug">Hand-picked from Pampore, the saffron capital of India</p>
                      </div>
                      <div className="flex items-end justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">₹899</span>
                          <span className="text-sm text-gray-400 line-through">₹1,199</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold text-sm group-hover:gap-2.5 transition-all">
                          Shop now
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Slide Navigation */}
      <div className="relative z-10 pb-8 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4">
            {/* Prev/Next Arrows */}
            <button
              onClick={prevSlide}
              disabled={isTransitioning}
              className="p-2.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all disabled:opacity-50"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Slide Indicators */}
            <div className="flex items-center gap-2 sm:gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide 
                      ? 'w-10 sm:w-8 h-3 sm:h-2 bg-amber-500' 
                      : 'w-3 sm:w-2 h-3 sm:h-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              disabled={isTransitioning}
              className="p-2.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all disabled:opacity-50"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Slide Counter (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 ml-4 text-white/60 text-sm">
              <span className="text-white font-semibold">{String(currentSlide + 1).padStart(2, '0')}</span>
              <span>/</span>
              <span>{String(slides.length).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
};
