/**
 * Steam API エラーハンドリングユーティリティ
 * エラーの分類、再試行ロジック、ユーザー向けメッセージの生成を担当
 */

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  retryDelay?: number;
}

/**
 * Steam API エラーコード定数
 */
export const STEAM_API_ERROR_CODES = {
  // 認証関連
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_API_KEY: 'INVALID_API_KEY',
  
  // リクエスト関連
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // データ関連
  INVALID_STEAM_ID: 'INVALID_STEAM_ID',
  VANITY_URL_NOT_FOUND: 'VANITY_URL_NOT_FOUND',
  PRIVATE_PROFILE: 'PRIVATE_PROFILE',
  
  // サーバー関連
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // その他
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * エラー情報マッピング
 */
const ERROR_INFO_MAP: Record<string, ErrorInfo> = {
  [STEAM_API_ERROR_CODES.MISSING_API_KEY]: {
    code: STEAM_API_ERROR_CODES.MISSING_API_KEY,
    message: 'Steam API key is not configured',
    userMessage: 'Steam APIキーが設定されていません。管理者にお問い合わせください。',
    retryable: false
  },
  
  [STEAM_API_ERROR_CODES.INVALID_API_KEY]: {
    code: STEAM_API_ERROR_CODES.INVALID_API_KEY,
    message: 'Invalid Steam API key',
    userMessage: 'Steam APIキーが無効です。管理者にお問い合わせください。',
    retryable: false
  },
  
  [STEAM_API_ERROR_CODES.RATE_LIMITED]: {
    code: STEAM_API_ERROR_CODES.RATE_LIMITED,
    message: 'API rate limit exceeded',
    userMessage: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
    retryable: true,
    retryDelay: 60000 // 1分
  },
  
  [STEAM_API_ERROR_CODES.TIMEOUT]: {
    code: STEAM_API_ERROR_CODES.TIMEOUT,
    message: 'Request timeout',
    userMessage: 'リクエストがタイムアウトしました。ネットワーク接続を確認してください。',
    retryable: true,
    retryDelay: 5000 // 5秒
  },
  
  [STEAM_API_ERROR_CODES.NETWORK_ERROR]: {
    code: STEAM_API_ERROR_CODES.NETWORK_ERROR,
    message: 'Network connection error',
    userMessage: 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。',
    retryable: true,
    retryDelay: 3000 // 3秒
  },
  
  [STEAM_API_ERROR_CODES.INVALID_STEAM_ID]: {
    code: STEAM_API_ERROR_CODES.INVALID_STEAM_ID,
    message: 'Invalid Steam ID format',
    userMessage: 'Steam IDまたはプロフィールURLの形式が正しくありません。正しい形式で入力してください。',
    retryable: false
  },
  
  [STEAM_API_ERROR_CODES.VANITY_URL_NOT_FOUND]: {
    code: STEAM_API_ERROR_CODES.VANITY_URL_NOT_FOUND,
    message: 'Vanity URL not found',
    userMessage: 'カスタムURLが見つかりません。正しいプロフィールURLを入力してください。',
    retryable: false
  },
  
  [STEAM_API_ERROR_CODES.PRIVATE_PROFILE]: {
    code: STEAM_API_ERROR_CODES.PRIVATE_PROFILE,
    message: 'Profile is private',
    userMessage: 'プロフィールが非公開に設定されています。Steamの設定でプロフィールを公開してください。',
    retryable: false
  },
  
  [STEAM_API_ERROR_CODES.SERVER_ERROR]: {
    code: STEAM_API_ERROR_CODES.SERVER_ERROR,
    message: 'Steam API server error',
    userMessage: 'Steam APIサーバーでエラーが発生しています。しばらく待ってから再試行してください。',
    retryable: true,
    retryDelay: 10000 // 10秒
  },
  
  [STEAM_API_ERROR_CODES.SERVICE_UNAVAILABLE]: {
    code: STEAM_API_ERROR_CODES.SERVICE_UNAVAILABLE,
    message: 'Steam API service unavailable',
    userMessage: 'Steam APIサービスが一時的に利用できません。しばらく待ってから再試行してください。',
    retryable: true,
    retryDelay: 30000 // 30秒
  },
  
  [STEAM_API_ERROR_CODES.INVALID_RESPONSE]: {
    code: STEAM_API_ERROR_CODES.INVALID_RESPONSE,
    message: 'Invalid API response format',
    userMessage: 'APIレスポンスの形式が正しくありません。しばらく待ってから再試行してください。',
    retryable: true,
    retryDelay: 5000 // 5秒
  },
  
  [STEAM_API_ERROR_CODES.UNKNOWN_ERROR]: {
    code: STEAM_API_ERROR_CODES.UNKNOWN_ERROR,
    message: 'Unknown error occurred',
    userMessage: '予期しないエラーが発生しました。しばらく待ってから再試行してください。',
    retryable: true,
    retryDelay: 5000 // 5秒
  }
};

/**
 * エラーコードからエラー情報を取得
 * @param code エラーコード
 * @returns エラー情報
 */
export function getErrorInfo(code: string): ErrorInfo {
  return ERROR_INFO_MAP[code] || ERROR_INFO_MAP[STEAM_API_ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * HTTPステータスコードからSteam APIエラーコードを推定
 * @param status HTTPステータスコード
 * @returns Steam APIエラーコード
 */
export function mapHttpStatusToErrorCode(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return STEAM_API_ERROR_CODES.INVALID_API_KEY;
    case 429:
      return STEAM_API_ERROR_CODES.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
      return STEAM_API_ERROR_CODES.SERVER_ERROR;
    case 504:
      return STEAM_API_ERROR_CODES.TIMEOUT;
    default:
      return STEAM_API_ERROR_CODES.UNKNOWN_ERROR;
  }
}

/**
 * ネットワークエラーからSteam APIエラーコードを推定
 * @param error エラーオブジェクト
 * @returns Steam APIエラーコード
 */
export function mapNetworkErrorToErrorCode(error: any): string {
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return STEAM_API_ERROR_CODES.TIMEOUT;
  }
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return STEAM_API_ERROR_CODES.NETWORK_ERROR;
  }
  
  return STEAM_API_ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * 再試行戦略クラス
 */
export class RetryStrategy {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;
  private backoffMultiplier: number;

  constructor(
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 30000,
    backoffMultiplier: number = 2
  ) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.backoffMultiplier = backoffMultiplier;
  }

  /**
   * 再試行すべきかどうかを判定
   * @param error エラーオブジェクト
   * @param attemptCount 試行回数
   * @returns 再試行すべきかどうか
   */
  shouldRetry(error: any, attemptCount: number): boolean {
    if (attemptCount >= this.maxRetries) {
      return false;
    }

    // SteamApiErrorの場合
    if (error.retryable !== undefined) {
      return error.retryable;
    }

    // HTTPエラーの場合
    if (error.status) {
      const errorCode = mapHttpStatusToErrorCode(error.status);
      const errorInfo = getErrorInfo(errorCode);
      return errorInfo.retryable;
    }

    // ネットワークエラーの場合
    const errorCode = mapNetworkErrorToErrorCode(error);
    const errorInfo = getErrorInfo(errorCode);
    return errorInfo.retryable;
  }

  /**
   * 再試行までの遅延時間を計算
   * @param attemptCount 試行回数
   * @param errorCode エラーコード（オプション）
   * @returns 遅延時間（ミリ秒）
   */
  calculateDelay(attemptCount: number, errorCode?: string): number {
    // エラー固有の遅延時間がある場合
    if (errorCode) {
      const errorInfo = getErrorInfo(errorCode);
      if (errorInfo.retryDelay) {
        return errorInfo.retryDelay;
      }
    }

    // 指数バックオフ
    const delay = this.baseDelay * Math.pow(this.backoffMultiplier, attemptCount - 1);
    
    // ジッター（ランダム要素）を追加
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.min(delay + jitter, this.maxDelay);
  }

  /**
   * 遅延実行
   * @param ms 遅延時間（ミリ秒）
   */
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 非公開プロフィール検出ユーティリティ
 */
export class PrivateProfileDetector {
  /**
   * ゲームライブラリレスポンスから非公開プロフィールを検出
   * @param response GetOwnedGamesのレスポンス
   * @returns 非公開プロフィールかどうか
   */
  static isPrivateProfile(response: any): boolean {
    // レスポンスにgamesプロパティが存在しない場合は非公開
    return !response.response || !response.response.games;
  }

  /**
   * プレイヤーサマリーから非公開プロフィールを検出
   * @param player プレイヤー情報
   * @returns 非公開プロフィールかどうか
   */
  static isPrivateFromPlayerSummary(player: any): boolean {
    // communityvisibilitystate が 1 の場合は非公開
    return player.communityvisibilitystate === 1;
  }

  /**
   * 非公開プロフィール用のユーザー向けメッセージを生成
   * @param steamId Steam ID
   * @returns ユーザー向けメッセージ
   */
  static generatePrivateProfileMessage(steamId: string): string {
    return `Steam ID ${steamId} のプロフィールは非公開に設定されています。\n\n` +
           `相性診断を行うには、以下の手順でプロフィールを公開してください：\n` +
           `1. Steamクライアントまたはウェブサイトにログイン\n` +
           `2. プロフィール設定を開く\n` +
           `3. プライバシー設定で「ゲーム詳細」を「公開」に変更\n` +
           `4. 設定を保存して再試行`;
  }
}

/**
 * エラーレポーティングユーティリティ
 */
export class ErrorReporter {
  /**
   * エラーをログに記録
   * @param error エラーオブジェクト
   * @param context 追加のコンテキスト情報
   */
  static logError(error: any, context?: Record<string, any>): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context
    };

    // 開発環境ではコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.error('Steam API Error:', errorInfo);
    }

    // 本番環境では外部サービスに送信（実装は省略）
    // 例: Sentry, LogRocket, etc.
  }

  /**
   * ユーザー向けエラーメッセージを生成
   * @param error エラーオブジェクト
   * @returns ユーザー向けメッセージ
   */
  static generateUserMessage(error: any): string {
    if (error.code) {
      const errorInfo = getErrorInfo(error.code);
      return errorInfo.userMessage;
    }

    // HTTPエラーの場合
    if (error.status) {
      const errorCode = mapHttpStatusToErrorCode(error.status);
      const errorInfo = getErrorInfo(errorCode);
      return errorInfo.userMessage;
    }

    // その他のエラー
    const errorInfo = getErrorInfo(STEAM_API_ERROR_CODES.UNKNOWN_ERROR);
    return errorInfo.userMessage;
  }
}

/**
 * デフォルトの再試行戦略インスタンス
 */
export const defaultRetryStrategy = new RetryStrategy();