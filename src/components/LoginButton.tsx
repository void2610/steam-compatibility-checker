'use client';

import { useSteamAuth } from '@/contexts/SteamAuthContext';
import { AuthErrorDisplay } from './AuthErrorBoundary';

// Steam ログインボタンコンポーネント
export function LoginButton() {
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

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {user.avatarUrl && (
            <img 
              src={user.avatarUrl} 
              alt={user.personaName || 'Steam Avatar'} 
              className="w-8 h-8 rounded-full"
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

  return (
    <>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>認証中...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Steamでログイン</span>
          </>
        )}
      </button>
      
      {error && (
        <AuthErrorDisplay
          error={error}
          onRetry={handleRetry}
          onDismiss={clearError}
        />
      )}
    </>
  );
}