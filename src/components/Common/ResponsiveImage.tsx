import React, { useState, useRef, useEffect } from 'react';
import { performanceMonitor, useImagePerformance } from '../../utils/performance';

interface ResponsiveImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    sizes?: string;
    quality?: number;
    priority?: boolean;
    onLoad?: () => void;
    onError?: () => void;
    breakpoints?: Record<string, number>;
}

interface ImageSource {
    src: string;
    width: number;
    height?: number | undefined; // Explicitly allow undefined for exactOptionalPropertyTypes
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
    src,
    alt,
    className = '',
    width,
    height,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quality = 80,
    priority = false,
    onLoad,
    onError,
    breakpoints = {
        xs: 320,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536
    }
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const [imageSources, setImageSources] = useState<ImageSource[]>([]);
    const imgRef = useRef<HTMLImageElement>(null);
    const intersectionRef = useRef<HTMLDivElement>(null);
    const { startLoading, endLoading } = useImagePerformance(src);

    // Modern image format detection
    const supportsWebP = (): boolean => {
        if (typeof window === 'undefined') return false;
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') > -1;
    };

    const supportsAVIF = (): boolean => {
        if (typeof window === 'undefined') return false;
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/avif').indexOf('avif') > -1;
    };

    // Generate image sources for different breakpoints
    const generateImageSources = (baseSrc: string): ImageSource[] => {
        if (baseSrc.startsWith('data:') || baseSrc.startsWith('blob:')) {
            return [{ src: baseSrc, width: width || 0 }];
        }

        const sources: ImageSource[] = [];

        // Generate sources for each breakpoint
        Object.entries(breakpoints).forEach(([breakpoint, size]) => {
            const width = size;
            const heightValue = height ? Math.round((height / (width || 1)) * width) : null;

            // Add AVIF if supported (best compression)
            if (supportsAVIF()) {
                sources.push({
                    src: `${baseSrc}?w=${width}&h=${heightValue || ''}&q=${quality}&f=avif`,
                    width,
                    height: heightValue
                });
            }

            // Add WebP if supported (good compression)
            if (supportsWebP()) {
                sources.push({
                    src: `${baseSrc}?w=${width}&h=${heightValue || ''}&q=${quality}&f=webp`,
                    width,
                    height: heightValue
                });
            }

            // Fallback to original format
            sources.push({
                src: `${baseSrc}?w=${width}&h=${heightValue || ''}&q=${quality}`,
                width,
                height: heightValue
            });
        });

        return sources;
    };

    // Generate srcSet string
    const generateSrcSet = (): string => {
        if (imageSources.length === 0) return '';

        // Group sources by format
        const avifSources = imageSources.filter(source => source.src.includes('f=avif'));
        const webpSources = imageSources.filter(source => source.src.includes('f=webp'));
        const defaultSources = imageSources.filter(source => !source.src.includes('f=avif') && !source.src.includes('f=webp'));

        // Prefer AVIF, then WebP, then default
        const preferredSources = avifSources.length > 0 ? avifSources :
            webpSources.length > 0 ? webpSources : defaultSources;

        return preferredSources.map(source =>
            `${source.src} ${source.width}w`
        ).join(', ');
    };

    useEffect(() => {
        setImageSources(generateImageSources(src));
    }, [src, breakpoints, quality, width, height]);

    useEffect(() => {
        if (priority) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px',
            }
        );

        if (intersectionRef.current) {
            observer.observe(intersectionRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
        performanceMonitor.endMeasure(`responsive-image-load-${src}`);
        endLoading(true);
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        performanceMonitor.endMeasure(`responsive-image-load-${src}`, false);
        endLoading(false);
        setHasError(true);
        onError?.();
    };

    // Start performance measurement when image starts loading
    useEffect(() => {
        if (isInView && !isLoaded && !hasError) {
            performanceMonitor.startMeasure(`responsive-image-load-${src}`);
            startLoading();
        }
    }, [isInView, src, isLoaded, hasError, startLoading]);

    // Safe fallback image
    const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4=';

    // Blur-up effect placeholder
    const blurPlaceholder = !isLoaded && !hasError && isInView;

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            ref={intersectionRef}
            style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
        >
            {/* Loading placeholder with animation */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
                    <div className="w-full h-full bg-gray-200 animate-shimmer"></div>
                </div>
            )}

            {/* Main image */}
            {isInView && (
                <img
                    ref={imgRef}
                    src={hasError ? fallbackImage : imageSources[0]?.src || src}
                    srcSet={generateSrcSet()}
                    sizes={sizes}
                    alt={alt}
                    width={width}
                    height={height}
                    className={`${className} transition-all duration-500 ease-out ${isLoaded
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-105 blur-sm'
                        } ${blurPlaceholder ? 'filter blur-sm' : ''}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    crossOrigin="anonymous"
                    style={{
                        filter: blurPlaceholder ? 'blur(2px)' : 'none',
                        transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
                    }}
                />
            )}

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Image not available</p>
                    </div>
                </div>
            )}
        </div>
    );
};