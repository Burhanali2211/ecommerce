import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User,
  AlertCircle, Loader2, Mountain, ArrowLeft, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ProfessionalAuthLayout } from '../components/Auth/ProfessionalAuthLayout';
import { useSettings } from '../contexts/SettingsContext';

type AuthMode = 'login' | 'signup' | 'forgot';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

interface FormErrors {
  [key: string]: string;
}

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const { showNotification } = useNotification();
  const { getSiteSetting } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const siteName = getSiteSetting('site_name') || 'Himalayan Spices';

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'seller') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const modeParam = searchParams.get('mode');

    if (modeParam === 'signup') {
      setMode('signup');
    } else if (modeParam === 'forgot') {
      setMode('forgot');
    }
  }, [location.search]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (mode !== 'forgot' && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (mode !== 'forgot' && !validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'signup') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (mode === 'login' && (!formData.email || !formData.email.trim())) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (mode === 'login' && (!formData.password || !formData.password.trim())) {
      setErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(formData.email.trim(), formData.password);
        showNotification({
          type: 'success',
          title: 'Welcome back!',
          message: 'Successfully logged in.'
        });
        // Navigation is handled by useEffect when user state changes
      } else if (mode === 'signup') {
        await signUp(formData.email, formData.password, {
          fullName: formData.fullName
        });
        showNotification({
          type: 'success',
          title: 'Account created!',
          message: 'Welcome to Himalayan Spices!'
        });
        // Navigation is handled by useEffect when user state changes
      } else if (mode === 'forgot') {
        showNotification({
          type: 'success',
          title: 'Password reset sent!',
          message: 'Password reset link sent to your email!'
        });
        setMode('login');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      showNotification({
        type: 'error',
        title: 'Authentication failed',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 bg-white/40 backdrop-blur-md border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="w-10 h-10 bg-amber-700 rounded-lg flex items-center justify-center shadow-md group-hover:bg-amber-800 transition-colors">
              <Mountain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-amber-900 hidden sm:block">
              Himalayan Spices
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 rounded-lg shadow-sm hover:bg-white hover:text-amber-700 transition-all duration-200 flex items-center space-x-2 border border-amber-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:block">Back to Home</span>
              <span className="xs:hidden">Home</span>
            </button>
            <Link
              to="/products"
              className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-lg shadow-sm hover:bg-amber-800 transition-all duration-200 flex items-center space-x-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden xs:block">Explore Spices</span>
              <span className="xs:hidden">Shop</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 sm:pt-24">
        <ProfessionalAuthLayout showBranding={true}>
          <div
            className="animate-fade-in-right"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="p-6 sm:p-8 lg:p-10">
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl mb-4 shadow-lg">
                  <Mountain className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {mode === 'login' && 'Sign in to explore premium Kashmiri spices'}
                  {mode === 'signup' && 'Join us for the finest Himalayan flavors'}
                  {mode === 'forgot' && "We'll send you a reset link"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name Field (Signup) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`block w-full pl-12 pr-4 py-3.5 border text-sm ${errors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                          } rounded-xl shadow-sm transition-colors`}
                        placeholder="Your full name"
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`block w-full pl-12 pr-4 py-3.5 border text-sm ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                        } rounded-xl shadow-sm transition-colors`}
                      placeholder="you@example.com"
                      disabled={loading}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                {mode !== 'forgot' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`block w-full pl-12 pr-12 py-3.5 border text-sm ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                          } rounded-xl shadow-sm transition-colors`}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                )}

                {/* Confirm Password Field (Signup) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`block w-full pl-12 pr-12 py-3.5 border text-sm ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                          } rounded-xl shadow-sm transition-colors`}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Remember Me & Forgot Password (Login) */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm font-medium text-amber-700 hover:text-amber-800 focus:outline-none transition-colors"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : mode === 'login' ? (
                      'Sign In'
                    ) : mode === 'signup' ? (
                      'Create Account'
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>

                {/* Mode Toggle */}
                <div className="text-center pt-4">
                  {mode === 'login' ? (
                    <p className="text-gray-600 text-sm">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="font-semibold text-amber-700 hover:text-amber-800 focus:outline-none transition-colors"
                        disabled={loading}
                      >
                        Sign up
                      </button>
                    </p>
                  ) : mode === 'signup' ? (
                    <p className="text-gray-600 text-sm">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="font-semibold text-amber-700 hover:text-amber-800 focus:outline-none transition-colors"
                        disabled={loading}
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="font-semibold text-amber-700 hover:text-amber-800 focus:outline-none transition-colors"
                        disabled={loading}
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>

                {/* Trust badges */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Secure
                    </span>
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Encrypted
                    </span>
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Private
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ProfessionalAuthLayout>
      </div>
    </div>
  );
};

export default AuthPage;
