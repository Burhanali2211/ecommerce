import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfessionalLoader } from './ProfessionalLoader';

interface PublicRouteProps {
  children: React.ReactNode;
  /**
   * If true, redirects authenticated users away from this route
   * Useful for login/register pages
   */
  redirectIfAuthenticated?: boolean;
  /**
   * Where to redirect authenticated users (if redirectIfAuthenticated is true)
   */
  redirectTo?: string;
}

/**
 * PublicRoute Component
 * 
 * For routes that should be accessible without authentication.
 * Optionally redirects authenticated users away (useful for login/register pages).
 * 
 * Usage:
 * <PublicRoute>
 *   <PublicComponent />
 * </PublicRoute>
 * 
 * Redirect authenticated users (e.g., login page):
 * <PublicRoute redirectIfAuthenticated={true} redirectTo="/dashboard">
 *   <LoginPage />
 * </PublicRoute>
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = false,
  redirectTo
}) => {
  const { user, loading } = useAuth();

  // Show loading while checking auth status
  if (loading) {
    return (
      <ProfessionalLoader
        fullPage={true}
        text="Loading..."
        showBrand={true}
      />
    );
  }

  // If redirectIfAuthenticated is true and user is logged in, redirect them
  if (redirectIfAuthenticated && user) {
    // Determine redirect destination based on user role
    const destination = redirectTo || 
      (user.role === 'admin' ? '/admin' : '/dashboard');
    return <Navigate to={destination} replace />;
  }

  // User is not authenticated or route allows authenticated users
  return <>{children}</>;
};

export default PublicRoute;

