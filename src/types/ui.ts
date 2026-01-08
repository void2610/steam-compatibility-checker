// UI関連の型定義

// ローディング状態
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// エラー状態
export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  retryable?: boolean;
}

// アプリケーション状態
export interface AppState {
  auth: {
    isAuthenticated: boolean;
    user: any | null;
    loading: LoadingState;
    error: ErrorState;
  };
  library: {
    currentUserLibrary: any | null;
    targetUserLibrary: any | null;
    loading: LoadingState;
    error: ErrorState;
  };
  analysis: {
    result: any | null;
    loading: LoadingState;
    error: ErrorState;
  };
}

// フォーム入力状態
export interface FormInputState {
  value: string;
  isValid: boolean;
  error?: string;
  touched: boolean;
}

// 相性診断フォーム状態
export interface CompatibilityFormState {
  steamIdInput: FormInputState;
  isSubmitting: boolean;
  submitError?: string;
}

// 結果表示設定
export interface ResultDisplayConfig {
  showDetailedStats: boolean;
  showCoopSuggestions: boolean;
  showRecommendations: boolean;
  sortBy: 'playtime' | 'compatibility' | 'name';
  filterByGenre?: string;
}

// シェア設定
export interface ShareConfig {
  includePersonalInfo: boolean;
  includeDetailedStats: boolean;
  platform: 'twitter' | 'discord' | 'url' | 'image';
}

// レスポンシブブレークポイント
export type BreakPoint = 'mobile' | 'tablet' | 'desktop';

// テーマ設定
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
}