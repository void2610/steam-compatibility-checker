'use client';

import { useSteamAuth } from '@/contexts/SteamAuthContext';
import { AuthErrorDisplay } from './AuthErrorBoundary';
import { UserProfile } from './UserProfile';

// Steam ログインボタンコンポーネント
interface LoginButtonProps {
  variant?: 'default' | 'compact' | 'full';
  showUserProfile?: boolean;
  className?: string;
}

export function LoginButton({ 
  variant = 'default', 
  showUserProfile = true,
  className = '' 
}: LoginButtonProps) {
  const { user, login, logout, isLoading, error, clearError } = useSteamAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      // エラーはコンテキストで処理される
      console.error('ログイン失敗:', err);
    }
  };

  const handleRetry = () => {
    clearError();
    handleLogin();
  };

  // 認証済みの場合の表示
  if (user) {
    if (!showUserProfile) {
      return (
        <button
          onClick={logout}
          className={`px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors ${className}`}
        >
          ログアウト
        </button>
      );
    }

    if (variant === 'compact') {
      return (
        <div className={`flex items-center space-x-3 ${className}`}>
          <UserProfile user={user} compact showLogout={false} />
          <button
            onClick={logout}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            ログアウト
          </button>
        </div>
      );
    }

    if (variant === 'full') {
      return (
        <div className={className}>
          <UserProfile user={user} showLogout />
        </div>
      );
    }

    // デフォルト表示
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2">
          {user.avatarUrl && (
            <img 
              src={user.avatarUrl} 
              alt={user.personaName || 'Steam Avatar'} 
              className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => user.profileUrl && window.open(user.profileUrl, '_blank')}
              title="Steamプロフィールを開く"
            />
          )}
          <span className="text-sm font-medium text-gray-700">
            {user.personaName || `Steam ID: ${user.steamId}`}
          </span>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          ログアウト
        </button>
      </div>
    );
  }

  // 未認証の場合のログインボタン
  const buttonSizes = {
    compact: 'px-4 py-2 text-sm',
    default: 'px-6 py-3 text-base',
    full: 'px-8 py-4 text-lg'
  };

  const iconSizes = {
    compact: 'w-4 h-4',
    default: 'w-5 h-5', 
    full: 'w-6 h-6'
  };

  return (
    <div className={className}>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`flex items-center justify-center space-x-2 ${buttonSizes[variant]} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md hover:shadow-lg`}
      >
        {isLoading ? (
          <>
            <div className={`animate-spin rounded-full ${iconSizes[variant]} border-b-2 border-white`}></div>
            <span>認証中...</span>
          </>
        ) : (
          <>
            <svg className={iconSizes[variant]} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.987 11.987s11.987-5.367 11.987-11.987C24.003 5.367 18.637.001 12.017.001zM8.232 4.609c.524 0 .947.424.947.947s-.424.947-.947.947-.947-.424-.947-.947.424-.947.947-.947zm7.554 0c.524 0 .947.424.947.947s-.424.947-.947.947-.947-.424-.947-.947.424-.947.947-.947zM12.017 19.312c-4.147 0-7.518-3.37-7.518-7.518 0-.829.134-1.627.38-2.37.246-.744.606-1.431 1.067-2.041.922-1.22 2.282-2.011 3.854-2.011 1.572 0 2.932.791 3.854 2.011.461.61.821 1.297 1.067 2.041.246.743.38 1.541.38 2.37 0 4.147-3.37 7.518-7.518 7.518z"/>
            </svg>
            <span>Steamでログイン</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-4">
          <AuthErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={clearError}
          />
        </div>
      )}
    </div>
  );
}

// 認証状態に応じたUI切り替えコンポーネント
interface AuthStateWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthStateWrapper({ 
  children, 
  fallback, 
  loadingComponent,
  requireAuth = false 
}: AuthStateWrapperProps) {
  const { user, isLoading } = useSteamAuth();

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      )
    );
  }

  if (requireAuth && !user) {
    return (
      fallback || (
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">この機能を使用するにはログインが必要です</p>
          <LoginButton />
        </div>
      )
    );
  }

  return <>{children}</>;
}