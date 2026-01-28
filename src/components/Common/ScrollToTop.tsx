import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that automatically scrolls to the top of the page
 * whenever the route changes. This ensures a consistent user experience
 * across all page transitions.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use smooth scrolling for better user experience
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  // This component doesn't render anything
  return null;
};