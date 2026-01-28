import React from 'react';
import { Loader, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  subText?: string;
  overlay?: boolean;
  className?: string;
  stage?: 'loading' | 'success' | 'error' | 'offline';
  progress?: number; // 0-100
  showProgress?: boolean;
  onRetry?: () => void;
}

// Backward compatibility
interface EnhancedLoadingSpinnerProps extends LoadingSpinnerProps {}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  subText,
  overlay = false,
  className = '',
  stage = 'loading',
  progress = 0,
  showProgress = false,
  onRetry
}) => {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  const getIcon = () => {
    switch (stage) {
      case 'success':
        return <CheckCircle className={`${sizes[size]} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${sizes[size]} text-red-500`} />;
      case 'offline':
        return <WifiOff className={`${sizes[size]} text-gray-500`} />;
      default:
        return <Loader className={`${sizes[size]} text-primary`} />;
    }
  };

  const getStatusColor = () => {
    switch (stage) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'offline':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="flex flex-col items-center">
          {getIcon()}
          
          {showProgress && stage === 'loading' && (
            <div className="w-32 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {text && (
            <p className={`mt-4 text-sm font-medium ${getStatusColor()}`}>
              {text}
            </p>
          )}

          {subText && (
            <p className="mt-2 text-xs text-gray-500 text-center max-w-xs">
              {subText}
            </p>
          )}
          
          {stage === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          )}

          {stage === 'offline' && (
            <div className="mt-4 flex items-center text-xs text-gray-500">
              <WifiOff className="h-3 w-3 mr-1" />
              <span>Check your internet connection</span>
            </div>
          )}
        </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Progressive loading component for multi-stage loading
interface ProgressiveLoadingProps {
  stages: Array<{
    name: string;
    description?: string;
    completed: boolean;
    loading: boolean;
    error?: boolean;
  }>;
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  stages,
  className = ''
}) => {
  const completedStages = stages.filter(stage => stage.completed).length;
  const totalStages = stages.length;
  const progress = (completedStages / totalStages) * 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Loading Content</h3>
          <span className="text-xs text-gray-500">{completedStages}/{totalStages}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="flex items-center space-x-3"
          >
            <div className="flex-shrink-0">
              {stage.completed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : stage.error ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : stage.loading ? (
                <Loader className="h-4 w-4 text-primary" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                stage.completed ? 'text-green-600' :
                stage.error ? 'text-red-600' :
                stage.loading ? 'text-primary' : 'text-gray-500'
              }`}>
                {stage.name}
              </p>
              {stage.description && (
                <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Backward compatibility export
export const EnhancedLoadingSpinner = LoadingSpinner;