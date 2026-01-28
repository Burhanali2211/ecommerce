import React, { memo } from 'react';
import { Sparkles } from 'lucide-react';

interface ProfessionalLoaderProps {
  fullPage?: boolean;
  text?: string;
  showBrand?: boolean;
}

/**
 * Professional, user-friendly loader component
 * Uses smooth animations and brand colors
 */
export const ProfessionalLoader = memo<ProfessionalLoaderProps>(({
  fullPage = true,
  text = 'Loading...',
  showBrand = true
}) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Brand Logo with Animation */}
      {showBrand && (
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-500 animate-spin" 
               style={{ animationDuration: '2s' }} />
          
          {/* Middle rotating ring (opposite direction) */}
          <div className="absolute inset-2 rounded-full border-3 border-transparent border-b-orange-500 border-l-orange-500 animate-spin" 
               style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
          
          {/* Inner logo */}
          <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Loading Text */}
      {text && (
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">{text}</p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-1">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" 
                  style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" 
                  style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" 
                  style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}

      {/* Subtle progress bar */}
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full animate-pulse" 
             style={{ width: '60%' }} />
      </div>

      {/* Trust message */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        We're preparing your experience. This usually takes just a moment.
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center z-50">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {loaderContent}
    </div>
  );
});

ProfessionalLoader.displayName = 'ProfessionalLoader';

/**
 * Minimal inline loader for smaller spaces
 */
export const MinimalLoader = memo(() => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" 
         style={{ animationDelay: '0s' }} />
    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" 
         style={{ animationDelay: '0.2s' }} />
    <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" 
         style={{ animationDelay: '0.4s' }} />
  </div>
));

MinimalLoader.displayName = 'MinimalLoader';

/**
 * Page transition loader with smooth fade
 */
export const PageTransitionLoader = memo<{ isLoading: boolean }>(({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <ProfessionalLoader fullPage={false} text="Loading..." showBrand={true} />
    </div>
  );
});

PageTransitionLoader.displayName = 'PageTransitionLoader';

