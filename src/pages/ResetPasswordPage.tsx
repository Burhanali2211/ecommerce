import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

type PageState = 'loading' | 'ready' | 'success' | 'invalid';

const ResetPasswordPage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showNotification } = useNotification();
  const { getSiteSetting } = useSettings();
  const navigate = useNavigate();

  const siteName = getSiteSetting('site_name') || 'Aligarh Attars';

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when it detects the hash fragment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
      }
    });

    // If no recovery event after 3 seconds, the link is invalid/expired
    const timer = setTimeout(() => {
      setPageState(prev => prev === 'loading' ? 'invalid' : prev);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPageState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      showNotification({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-white border text-gray-900 text-sm rounded-xl pl-10 pr-11 py-3.5 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : 'border-gray-200 focus:border-gray-400 focus:ring-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-3">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt={siteName}
              className="h-9 w-9 object-contain rounded-lg"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-semibold text-gray-900 text-[15px]">{siteName}</span>
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-5 pt-10 pb-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7">

            {pageState === 'loading' && (
              <div className="text-center py-6">
                <Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Verifying your reset link…</p>
              </div>
            )}

            {pageState === 'invalid' && (
              <div className="text-center py-2 space-y-4">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 mb-1">Link expired</h1>
                  <p className="text-gray-500 text-sm">This reset link is invalid or has already been used.</p>
                </div>
                <Link
                  to="/auth?mode=forgot"
                  className="block w-full bg-gray-900 text-white text-sm font-semibold rounded-xl py-3.5 text-center hover:bg-gray-800 transition-colors"
                >
                  Request a new link
                </Link>
              </div>
            )}

            {pageState === 'success' && (
              <div className="text-center py-2 space-y-4">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 mb-1">Password updated</h1>
                  <p className="text-gray-500 text-sm">Your password has been changed. You can now sign in.</p>
                </div>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-gray-900 text-white text-sm font-semibold rounded-xl py-3.5 hover:bg-gray-800 transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}

            {pageState === 'ready' && (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Set new password</h1>
                  <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                        placeholder="••••••••"
                        disabled={loading}
                        autoComplete="new-password"
                        className={inputClass(!!errors.password)}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' })); }}
                        placeholder="••••••••"
                        disabled={loading}
                        autoComplete="new-password"
                        className={inputClass(!!errors.confirmPassword)}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">Must be at least 8 characters.</p>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl py-3.5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Updating password…</>
                      ) : 'Update password'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
