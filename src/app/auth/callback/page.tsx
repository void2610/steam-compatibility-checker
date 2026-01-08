'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { extractSteamId, validateOpenIdResponse } from '@/lib/steam-auth';
import { useSteamAuth } from '@/contexts/SteamAuthContext';
import { 
  AuthError, 
  AuthErrorType, 
  createAuthError, 
  logAuthError, 
  determineErrorType,
  getRecoveryActions 
} from '@/lib/auth-errors';

// 認証コールバック処理コンポーネント
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setLoading } = useSteamAuth();
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // URLSearchParamsに変換
        const params = new URLSearchParams(searchParams.toString());

        // OpenIDレスポンスの基本検証
        if (!validateOpenIdResponse(params)) {
          const validationError = createAuthError(AuthErrorType.OPENID_INVALID);
          throw validationError;
        }

        // Steam IDの抽出
        const authResult = extractSteamId(params);
        
        if (!authResult.success) {
          const errorType = authResult.error?.includes('キャンセル') 
            ? AuthErrorType.USER_CANCELLED 
            : AuthErrorType.STEAM_ID_INVALID;
          const extractionError = createAuthError(errorType);
          extractionError.message = authResult.error || extractionError.message;
          throw extractionError;
        }

        if (!authResult.steamId) {
          const steamIdError = createAuthError(AuthErrorType.STEAM_ID_INVALID);
          throw steamIdError;
        }

        // ユーザー情報を一時的に設定（プロフィール情報は後で取得）
        const tempUser = {
          steamId: authResult.steamId,
          personaName: '',
          avatarUrl: '',
          profileUrl: `https://steamcommunity.com/profiles/${authResult.steamId}`,
          communityVisibilityState: 0,
        };

        setUser(tempUser);

        // メインページにリダイレクト
        router.push('/');
        
      } catch (err) {
        console.error('認証エラー:', err);
        
        let authError: AuthError;
        if (err && typeof err === 'object' && 'type' in err && 'userMessage' in err) {
          authError = err as AuthError;
        } else {
          const errorType = determineErrorType(err);
          authError = createAuthError(errorType, err as Error);
        }
        
        setError(authError);
        logAuthError(authError);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, router, setUser, setLoading]);

  if (error) {
    const recoveryActions = getRecoveryActions(error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                ホームに戻る
              </button>
              {error.retryable && (
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  再試行
                </button>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-400">
              エラーID: {error.type} | {error.timestamp.toLocaleString('ja-JP')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">認証処理中...</h3>
        <p className="text-sm text-gray-500">Steam認証を処理しています。しばらくお待ちください。</p>
      </div>
    </div>
  );
}

// 認証コールバックページ
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">読み込み中...</h3>
          <p className="text-sm text-gray-500">認証情報を読み込んでいます。</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}