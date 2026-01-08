// Co-opゲーム関連の型定義

// Co-opゲームタイプ
export type CoopType = 'local' | 'online' | 'both';

// Co-opゲーム情報
export interface CoopGameInfo {
  appId: number;
  name: string;
  coopType: CoopType;
  maxPlayers: number;
  description: string;
  steamUrl: string;
  genres: string[];
  isPopular: boolean;
}

// Co-opゲーム提案
export interface CoopGameSuggestion {
  appId: number;
  name: string;
  coopType: CoopType;
  maxPlayers: number;
  description: string;
  steamUrl: string;
  compatibilityScore: number;
  recommendationReason: string;
  bothOwnGame: boolean;
}

// Co-opゲーム静的データベース型
export interface CoopGameDatabase {
  [appId: number]: CoopGameInfo;
}

// Co-opゲーム検索フィルター
export interface CoopGameFilter {
  coopType?: CoopType;
  maxPlayers?: number;
  genres?: string[];
  minCompatibilityScore?: number;
}

// Co-opゲーム統計
export interface CoopGameStats {
  totalCoopGames: number;
  localCoopGames: number;
  onlineCoopGames: number;
  bothCoopGames: number;
  averageMaxPlayers: number;
  popularGenres: string[];
}