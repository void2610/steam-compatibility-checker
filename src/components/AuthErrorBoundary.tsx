'use client';

import React, { Component, ReactNode } from 'react';
import { AuthError, AuthErrorType, createAuthError, logAuthError, getRecoveryActions } from '@/lib/auth-errors';

// エラーバウンダリのProps
interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AuthError, retry: () => void) => ReactNode;
}

// エラーバウンダリのState
interface AuthErrorBoundaryState {
  hasError: boolean;
  error: AuthError | null;
}

// 認証エラーバウンダリ
export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    const authError = createAuthError(AuthErrorType.UNKNOWN_ERROR, error);
    logAuthError(authError);
    
    return {
      hasError: true,
      error: authError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('認証エラーバウンダリでキャッチされたエラー:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return <DefaultAuthErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// デフォルトのエラーフォールバックコンポーネント
interface DefaultAuthErrorFallbackProps {
  error: AuthError;
  retry: () => void;
}

function DefaultAuthErrorFallback({ error, retry }: DefaultAuthErrorFallbackProps) {
  const recoveryActions = getRecoveryActions(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">認証エラー</h3>
          <p className="text-sm text-gray-500 mb-4">{error.userMessage}</p>
          
          {recoveryActions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">解決方法:</h4>
              <ul className="text-xs text-gray-600 text-left space-y-1">
                {recoveryActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            {error.retryable && (
              <button
                onClick={retry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                再試行
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            エラーID: {error.type} | {error.timestamp.toLocaleString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  );
}

// 認証エラー表示用のフックコンポーネント
interface AuthErrorDisplayProps {
  error: AuthError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function AuthErrorDisplay({ error, onRetry, onDismiss }: AuthErrorDisplayProps) {
  if (!error) return null;

  const recoveryActions = getRecoveryActions(error);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">認証エラー</h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">{error.userMessage}</p>
        </div>
        
        {recoveryActions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">解決方法:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {recoveryActions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              閉じる
            </button>
          )}
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
          )}
        </div>
      </div>
    </div>
  );
}