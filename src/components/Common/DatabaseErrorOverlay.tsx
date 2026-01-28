import React from 'react';
import { AlertTriangle, X, Database, RefreshCw } from 'lucide-react';
import { useError } from '../../contexts/ErrorContext';
import { detectRLSRecursionError, generateRLSFixSuggestion } from '../../utils/errorHandling';

export const DatabaseErrorOverlay: React.FC = () => {
  const { error, setError } = useError();

  if (!error) return null;

  // In direct login mode, we don't need to show database errors
  if (import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true') {
    return null;
  }

  // Detect specific error types
  const errorObj = new Error(error);
  const isRLSRecursion = detectRLSRecursionError(errorObj);
  const isRLSIssue = error.includes('row-level security') || error.includes('policy');
  const isConnectionIssue = error.includes('connection') || error.includes('network');

  // Generate appropriate guidance
  const getErrorGuidance = () => {
    if (isRLSRecursion) {
      return {
        title: 'RLS Infinite Recursion Detected',
        description: 'Your database Row Level Security policies are causing an infinite loop. This is a common setup issue that can be easily fixed.',
        solution: [
          'Run the rls_policies_fix.sql script in your Supabase SQL Editor',
          'This script replaces problematic policies with safe alternatives',
          'The fix includes role caching to prevent future recursion issues',
          'After running the script, refresh this page'
        ],
        scriptFile: 'rls_policies_fix.sql',
        severity: 'critical'
      };
    }

    if (isRLSIssue) {
      return {
        title: 'Row Level Security Policy Issue',
        description: 'There\'s an issue with your database security policies. This affects data access permissions.',
        solution: [
          'Check your user role and permissions',
          'Run the database_schema_fixes.sql script to ensure policies are correct',
          'Verify you have the necessary access rights',
          'Contact support if the issue persists'
        ],
        scriptFile: 'database_schema_fixes.sql',
        severity: 'high'
      };
    }

    if (isConnectionIssue) {
      return {
        title: 'Database Connection Error',
        description: 'Unable to connect to the database. This could be a network or configuration issue.',
        solution: [
          'Check your internet connection',
          'Verify your Supabase project is active',
          'Check environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)',
          'Try refreshing the page'
        ],
        scriptFile: null,
        severity: 'medium'
      };
    }

    return {
      title: 'Database Configuration Required',
      description: 'A critical database setup error has been detected. Your database needs proper configuration.',
      solution: [
        'Run the complete_ecommerce_schema.sql script in your Supabase SQL Editor',
        'Then run the database_schema_fixes.sql script',
        'Finally run the rls_policies_fix.sql script',
        'Refresh the page after completing all scripts'
      ],
      scriptFile: 'complete_ecommerce_schema.sql',
      severity: 'critical'
    };
  };

  const guidance = getErrorGuidance();

  const getSeverityColor = () => {
    switch (guidance.severity) {
      case 'critical': return 'bg-red-900/95';
      case 'high': return 'bg-orange-900/95';
      case 'medium': return 'bg-yellow-900/95';
      default: return 'bg-red-900/95';
    }
  };

  const getSeverityIcon = () => {
    switch (guidance.severity) {
      case 'critical': return AlertTriangle;
      case 'high': return Database;
      case 'medium': return RefreshCw;
      default: return AlertTriangle;
    }
  };

  const SeverityIcon = getSeverityIcon();

  return (
    <div className={`fixed inset-0 ${getSeverityColor()} text-white z-[200] flex items-center justify-center p-8`}>
      <div className="max-w-4xl text-center">
        <SeverityIcon className="mx-auto h-16 w-16 text-yellow-400 mb-6" />
        <h1 className="text-4xl font-bold mb-4">{guidance.title}</h1>
        <p className="text-xl text-red-100 mb-8">
          {guidance.description}
        </p>

        {/* Error Details */}
        <div className="bg-black/30 p-6 rounded-lg text-left font-mono text-sm mb-8 max-h-32 overflow-y-auto">
          <p className="font-bold text-yellow-300 mb-2">&gt; Error Details:</p>
          <p className="break-words">{error}</p>
        </div>

        {/* Solution Steps */}
        <div className="bg-black/20 p-6 rounded-lg text-left mb-8">
          <h3 className="font-bold text-yellow-300 mb-4 text-lg">🔧 How to Fix This:</h3>
          <ol className="list-decimal list-inside space-y-2 text-red-100">
            {guidance.solution.map((step, index) => (
              <li key={index} className="leading-relaxed">{step}</li>
            ))}
          </ol>

          {guidance.scriptFile && (
            <div className="mt-4 p-3 bg-blue-900/30 rounded border border-blue-500">
              <p className="text-blue-200 text-sm">
                📄 <strong>Script to run:</strong> <code className="bg-black/30 px-2 py-1 rounded">{guidance.scriptFile}</code>
              </p>
            </div>
          )}
        </div>

        {/* RLS-specific additional help */}
        {isRLSRecursion && (
          <div className="bg-purple-900/20 border border-purple-500 p-4 rounded-lg mb-8 text-left">
            <h4 className="font-bold text-purple-300 mb-2">💡 Understanding RLS Recursion:</h4>
            <p className="text-purple-100 text-sm leading-relaxed">
              Row Level Security (RLS) infinite recursion occurs when a security policy on a table references the same table
              in its condition. For example, checking if a user is an admin by querying the profiles table from within a
              profiles table policy creates a loop. Our fix uses safe role caching to avoid this issue.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setError(null)}
            className="bg-yellow-400 text-red-900 font-bold px-8 py-3 rounded-lg hover:bg-yellow-300 transition-colors flex items-center"
          >
            <X className="mr-2 h-5 w-5" />
            I will fix this (Dismiss)
          </button>

          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Refresh Page
          </button>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 text-sm text-red-200">
          <p>Need help? Check the project documentation or contact support.</p>
          <p className="mt-2">
            📚 <strong>Files in your project:</strong> All SQL scripts are in your project root directory
          </p>
        </div>
      </div>
    </div>
  );
};