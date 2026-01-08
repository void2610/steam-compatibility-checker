'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SteamUser, SteamAuthContext as ISteamAuthContext } from '@/types/steam';
import { redirectToSteamAuth } from '@/lib/steam-auth';
import { 
  AuthError, 
  AuthErrorType, 
  createAuthError, 
  logAuthError, 
  determineErrorType,
  isSessionExpired,
  handleSessionExpiry 
} from '@/lib/auth-errors';

// 拡張された認証コンテキスト
interface ExtendedSteamAuthContext extends ISteamAuthContext {
  error: AuthError | null;
  clearError: () => void;
  setUser: (user: SteamUser | null) => void;
  setLoading: (loading: boolean) => void;
}

// セッションストレージのキー
const SESSION_STORAGE_KEY = 'steam_user';

// Steam認証コンテキストの作成
const SteamAuthContext = createContext<ExtendedSteamAuthContext | undefined>(undefined);

// Steam認証プロバイダーのProps
interface SteamAuthProviderProps {
  children: React.ReactNode;
}

// Steam認証プロバイダー
export function SteamAuthProvider({ children }: SteamAuthProviderProps) {
  const [user, setUserState] = useState<SteamUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // セッションストレージからユーザー情報を復元
  useEffect(() => {
    const restoreUserSession = () => {
      try {
        if (typeof window !== 'undefined') {
          // セッション期限切れのチェック
          if (isSessionExpired()) {
            handleSessionExpiry();
            const expiredError = createAuthError(AuthErrorType.SESSION_EXPIRED);
            setError(expiredError);
            logAuthError(expiredError);
            return;
          }

          const savedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser) as SteamUser;
            setUserState(parsedUser);
          }
        }
      } catch (error) {
        console.error('セッション復元エラー:', error);
        const authError = createAuthError(determineErrorType(error), error as Error);
        setError(authError);
        logAuthError(authError);
        
        // 破損したセッションデータをクリア
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreUserSession();
  }, []);

  // ユーザー情報の設定（セッションストレージに保存）
  const setUser = useCallback((newUser: SteamUser | null) => {
    setUserState(newUser);
    setError(null); // ユーザー設定時にエラーをクリア
    
    if (typeof window !== 'undefined') {
      if (newUser) {
        // セッションタイムスタンプを追加
        const userWithTimestamp = {
          ...newUser,
          sessionTimestamp: new Date().toISOString(),
        };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userWithTimestamp));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // ローディング状態の設定
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // エラーのクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Steam認証の開始
  const login = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Steam OpenID認証にリダイレクト
      redirectToSteamAuth();
    } catch (error) {
      console.error('ログインエラー:', error);
      const authError = createAuthError(determineErrorType(error), error as Error);
      setError(authError);
      logAuthError(authError);
      setIsLoading(false);
      throw authError;
    }
  }, []);

  // ログアウト処理
  const logout = useCallback((): void => {
    setUser(null);
    setError(null);
    
    // セッションストレージをクリア
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [setUser]);

  // コンテキスト値
  const contextValue: ExtendedSteamAuthContext = {
    user,
    login,
    logout,
    isLoading,
    error,
    clearError,
    setUser,
    setLoading,
  };

  return (
    <SteamAuthContext.Provider value={contextValue}>
      {children}
    </SteamAuthContext.Provider>
  );
}

// Steam認証コンテキストのフック
export function useSteamAuth() {
  const context = useContext(SteamAuthContext);
  
  if (context === undefined) {
    throw new Error('useSteamAuth must be used within a SteamAuthProvider');
  }
  
  return context;
}

// 認証状態のチェック用フック
export function useAuthStatus() {
  const { user, isLoading, error } = useSteamAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
    error,
  };
}

// セッション管理ユーティリティ
export const sessionUtils = {
  // セッションの有効性チェック
  isSessionValid(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const savedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return !!savedUser && JSON.parse(savedUser).steamId;
    } catch {
      return false;
    }
  },

  // セッションのクリア
  clearSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  },

  // セッション情報の取得
  getSessionUser(): SteamUser | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  },
};