import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

interface LuxuryGalleryProps {
  images: string[];
  name: string;
}

export const LuxuryGallery: React.FC<LuxuryGalleryProps> = ({ images, name }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative">
      {/* Main Image Display */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-luxury-xl bg-stone-100 group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
        <AnimatePresence mode="wait">
          <motion.img
            key={images[activeIdx]}
            src={images[activeIdx]}
            alt={name}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        
        {/* Gallery Controls Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
        <button className="absolute bottom-6 right-6 p-3 bg-white/90 backdrop-blur rounded-full shadow-luxury opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-5 w-5 text-stone-900" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={img}
              onClick={() => setActiveIdx(idx)}
              className={`relative flex-shrink-0 w-24 aspect-[4/5] rounded-luxury overflow-hidden border-2 transition-all duration-300 ${
                activeIdx === idx ? 'border-stone-800 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`${name} thumb ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal (Simplified for now) */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 lg:p-12 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={images[activeIdx]} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
};
