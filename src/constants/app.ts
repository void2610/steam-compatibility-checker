// アプリケーション関連の定数

// アプリケーション情報
export const APP_INFO = {
  NAME: 'Steam相性診断',
  DESCRIPTION: 'Steamユーザー同士のゲーミング相性を分析するWebアプリケーション',
  VERSION: '1.0.0',
  AUTHOR: 'Steam Compatibility Checker',
} as const;

// ルート定義
export const ROUTES = {
  HOME: '/',
  AUTH_CALLBACK: '/auth/callback',
  ANALYSIS: '/analysis',
  RESULTS: '/results',
  SHARE: '/share',
} as const;

// ローカルストレージキー
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'steam_auth_token',
  USER_PROFILE: 'user_profile',
  ANALYSIS_CACHE: 'analysis_cache',
  THEME_PREFERENCE: 'theme_preference',
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  AUTH_FAILED: 'Steam認証に失敗しました。再度お試しください。',
  PRIVATE_PROFILE: 'プロフィールが非公開に設定されています。公開設定に変更してください。',
  INVALID_STEAM_ID: '無効なSteam IDまたはURLです。正しい形式で入力してください。',
  API_RATE_LIMIT: 'APIの利用制限に達しました。しばらく待ってから再度お試しください。',
  INSUFFICIENT_DATA: 'データが不足しているため、相性分析を実行できません。',
  GENERIC_ERROR: '予期しないエラーが発生しました。',
} as const;

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  AUTH_SUCCESS: 'Steam認証が完了しました。',
  ANALYSIS_COMPLETE: '相性分析が完了しました。',
  SHARE_GENERATED: 'シェア用URLが生成されました。',
} as const;

// UI設定
export const UI_CONFIG = {
  ANIMATION_DURATION_MS: 300,
  DEBOUNCE_DELAY_MS: 500,
  TOAST_DURATION_MS: 5000,
  LOADING_SPINNER_DELAY_MS: 200,
} as const;

// レスポンシブブレークポイント（Tailwind CSSと一致）
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;