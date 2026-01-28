import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Award, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
    // Background images array - using spice/himalayan images
      const backgroundImages = [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
        'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=1600&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
      ];

      const [currentImageIndex, setCurrentImageIndex] = useState(0);
      const [isLoaded, setIsLoaded] = useState(false);
      const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
      const [nextImageIndex, setNextImageIndex] = useState(1);


  // Change background image every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1;
        setNextImageIndex(nextIndex === backgroundImages.length - 1 ? 0 : nextIndex + 1);
        return nextIndex;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Preload images progressively for smooth transitions
  useEffect(() => {
    const preloadImages = async () => {
      // First, load the first image immediately
      const firstImage = new Image();
      firstImage.onload = () => {
        setLoadedImages(prev => new Set(prev).add(0));
        setIsLoaded(true);
      };
      firstImage.onerror = () => {
        console.warn('First image failed to load');
        setIsLoaded(true); // Continue anyway
      };
      firstImage.src = backgroundImages[0] || '';

      // Then preload remaining images in background
      for (let i = 1; i < backgroundImages.length; i++) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(i));
        };
        img.onerror = () => {
          console.warn(`Image ${i} failed to load`);
        };
        img.src = backgroundImages[i] || '';
      }
    };

    preloadImages();
  }, [backgroundImages]);

  // Preload next image before transition
  useEffect(() => {
    if (!loadedImages.has(nextImageIndex) && nextImageIndex < backgroundImages.length) {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(nextImageIndex));
      };
      img.src = backgroundImages[nextImageIndex] || '';
    }
  }, [nextImageIndex, backgroundImages, loadedImages]);

  return (
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-900 via-orange-900 to-amber-950">
        {/* Dynamic Background Images */}
        <div className="absolute inset-0">
          {/* Professional overlay - deep, warm spice tones */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-amber-950/40 to-black/60 z-10"></div>

          {/* Background Images with Smooth Transition */}
          {backgroundImages.map((image, index) => {
            const isCurrentImage = index === currentImageIndex;
            const isImageLoaded = loadedImages.has(index);
            const shouldShow = isCurrentImage && isLoaded && isImageLoaded;

            return (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out ${shouldShow ? 'opacity-100' : 'opacity-0'
                  }`}
                style={{
                  backgroundImage: `url('${image}')`,
                  willChange: isCurrentImage ? 'opacity' : 'auto',
                }}
              />
            );
          })}

          {/* Fallback warm background - shown while first image loads */}
          <div
            className={`absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'
              }`}
          />
        </div>

        {/* Main Content with Animations */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Trust Badge - Above Heading */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 md:mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs sm:text-sm font-medium animate-fade-in-down shadow-lg"
              style={{ animationDelay: '0.05s' }}
            >
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" />
              <span className="flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                <span>Trusted by 10,000+ Customers Worldwide</span>
              </span>
            </div>

              {/* Main Heading - Two Lines Like Reference - Fade in from top */}
              <h1
                className="font-roboto text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight tracking-tight animate-fade-in-down"
                style={{ animationDelay: '0.1s' }}
              >
                <span className="block drop-shadow-2xl">
                  Premium Himalayan
                </span>
                <span className="block drop-shadow-2xl text-amber-400">
                  Spices & Herbs
                </span>
              </h1>

              {/* Description - Clean Paragraph - Fade in with delay */}
              <p
                className="text-base sm:text-lg md:text-xl text-amber-100/90 mb-8 md:mb-10 leading-relaxed max-w-3xl mx-auto drop-shadow-md font-normal animate-fade-in-up font-roboto"
                style={{ animationDelay: '0.2s' }}
              >
                Discover authentic spices, aromatic herbs, exotic teas, and organic products sourced directly from Himalayan farmers. Pure flavors, exceptional quality.
              </p>

            {/* Buttons - Reference Style - Fade in from bottom with delay */}
            <div
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center animate-fade-in-up mb-6 md:mb-8"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                to="/products"
                className="group relative w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-amber-500 text-white font-semibold text-sm md:text-base rounded-lg transition-all duration-200 hover:bg-amber-600 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Shop Spices</span>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="group relative w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-transparent text-white font-semibold text-sm md:text-base rounded-lg transition-all duration-200 hover:bg-white/5 flex items-center justify-center gap-2 border-2 border-white/40 backdrop-blur-sm"
              >
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
              <span>Learn More</span>
            </Link>
          </div>

              {/* Disclaimer Text - Bottom Center - Like Reference */}
              <p
                className="text-xs sm:text-sm text-amber-100/70 animate-fade-in-up"
                style={{ animationDelay: '0.4s' }}
              >
                Free Shipping Over ₹999 • 100% Authentic • Direct from Kashmir
              </p>
        </div>
      </div>

      {/* Animation Keyframes - Optimized for performance */}
      <style>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translate3d(0, -20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translate3d(-20px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translate3d(20px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity, transform;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity, transform;
        }

        .animate-fade-in-left {
          animation: fade-in-left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity, transform;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity, transform;
        }

        /* Remove will-change after animation completes to save resources */
        .animate-fade-in-down,
        .animate-fade-in-up,
        .animate-fade-in-left,
        .animate-fade-in-right {
          animation-fill-mode: both;
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes slide-up-from-bottom {
          from {
            opacity: 0;
            transform: translate3d(0, 100%, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        .animate-slide-up-from-bottom {
          animation: slide-up-from-bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-fade-out {
          animation: fade-out 0.4s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-down,
          .animate-fade-in-up,
          .animate-fade-in-left,
          .animate-fade-in-right,
          .animate-slide-up-from-bottom,
          .animate-fade-out,
          .animate-fade-in,
          .animate-shimmer,
          .animate-bounce-subtle {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .mobile-optimized {
            font-size: 0.625rem;
          }
        }
      `}</style>



    </section>
  );
};