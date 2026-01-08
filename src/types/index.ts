// 型定義のエクスポート

// Steam API関連
export * from './steam';

// Co-opゲーム関連
export * from './coop';

// 相性分析関連
export * from './compatibility';

// UI関連
export * from './ui';

// 共通ユーティリティ型
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
};

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};