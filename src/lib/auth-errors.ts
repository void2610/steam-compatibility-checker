// 認証エラーハンドリング

// 認証エラーの種類
export enum AuthErrorType {
  OPENID_INVALID = 'OPENID_INVALID',
  STEAM_ID_INVALID = 'STEAM_ID_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  USER_CANCELLED = 'USER_CANCELLED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 認証エラー情報
export interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  timestamp: Date;
}

// エラーメッセージのマッピング
const ERROR_MESSAGES: Record<AuthErrorType, { message: string; userMessage: string; retryable: boolean }> = {
  [AuthErrorType.OPENID_INVALID]: {
    message: 'Invalid OpenID response received',
    userMessage: '無効な認証レスポンスです。再度お試しください。',
    retryable: true,
  },
  [AuthErrorType.STEAM_ID_INVALID]: {
    message: 'Invalid Steam ID format',
    userMessage: '無効なSteam IDです。正しいSteam IDを確認してください。',
    retryable: false,
  },
  [AuthErrorType.SESSION_EXPIRED]: {
    message: 'Authentication session has expired',
    userMessage: 'セッションの有効期限が切れました。再度ログインしてください。',
    retryable: true,
  },
  [AuthErrorType.NETWORK_ERROR]: {
    message: 'Network error during authentication',
    userMessage: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    retryable: true,
  },
  [AuthErrorType.USER_CANCELLED]: {
    message: 'User cancelled authentication',
    userMessage: '認証がキャンセルされました。',
    retryable: true,
  },
  [AuthErrorType.UNKNOWN_ERROR]: {
    message: 'Unknown authentication error',
    userMessage: '予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。',
    retryable: true,
  },
};

// 認証エラーの作成
export function createAuthError(type: AuthErrorType, originalError?: Error): AuthError {
  const errorInfo = ERROR_MESSAGES[type];
  
  return {
    type,
    message: originalError?.message || errorInfo.message,
    userMessage: errorInfo.userMessage,
    retryable: errorInfo.retryable,
    timestamp: new Date(),
  };
}

// エラーの種類を判定
export function determineErrorType(error: unknown): AuthErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('cancel')) {
      return AuthErrorType.USER_CANCELLED;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return AuthErrorType.NETWORK_ERROR;
    }
    
    if (message.includes('steam id') || message.includes('invalid')) {
      return AuthErrorType.STEAM_ID_INVALID;
    }
    
    if (message.includes('openid') || message.includes('response')) {
      return AuthErrorType.OPENID_INVALID;
    }
    
    if (message.includes('session') || message.includes('expired')) {
      return AuthErrorType.SESSION_EXPIRED;
    }
  }
  
  return AuthErrorType.UNKNOWN_ERROR;
}

// エラーログの記録
export function logAuthError(error: AuthError): void {
  console.error('認証エラー:', {
    type: error.type,
    message: error.message,
    timestamp: error.timestamp,
    retryable: error.retryable,
  });
  
  // 本番環境では外部ログサービスに送信することも可能
  if (process.env.NODE_ENV === 'production') {
    // TODO: 外部ログサービスへの送信実装
  }
}

// セッション期限切れの検出
export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessionData = sessionStorage.getItem('steam_user');
    if (!sessionData) return false;
    
    const user = JSON.parse(sessionData);
    
    // セッションタイムスタンプがない場合は期限切れとみなす
    if (!user.sessionTimestamp) return true;
    
    const sessionTime = new Date(user.sessionTimestamp);
    const now = new Date();
    const sessionDuration = now.getTime() - sessionTime.getTime();
    
    // 24時間でセッション期限切れ
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
    
    return sessionDuration > SESSION_TIMEOUT;
  } catch {
    return true;
  }
}

// セッション期限切れの処理
export function handleSessionExpiry(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('steam_user');
  }
}

// 再試行可能なエラーかどうかの判定
export function isRetryableError(error: AuthError): boolean {
  return error.retryable;
}

// エラー回復の提案
export function getRecoveryActions(error: AuthError): string[] {
  const actions: string[] = [];
  
  switch (error.type) {
    case AuthErrorType.NETWORK_ERROR:
      actions.push('インターネット接続を確認してください');
      actions.push('しばらく時間をおいて再度お試しください');
      break;
      
    case AuthErrorType.SESSION_EXPIRED:
      actions.push('再度ログインしてください');
      break;
      
    case AuthErrorType.OPENID_INVALID:
      actions.push('ブラウザのキャッシュをクリアしてください');
      actions.push('別のブラウザで試してください');
      break;
      
    case AuthErrorType.STEAM_ID_INVALID:
      actions.push('Steam IDが正しいか確認してください');
      actions.push('Steamプロフィールが公開設定になっているか確認してください');
      break;
      
    case AuthErrorType.USER_CANCELLED:
      actions.push('Steam認証ページで「許可」をクリックしてください');
      break;
      
    default:
      actions.push('ページを再読み込みしてください');
      actions.push('問題が続く場合はサポートにお問い合わせください');
  }
  
  return actions;
}