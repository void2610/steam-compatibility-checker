// 相性分析関連の型定義

import { CoopGameSuggestion } from './coop';

// 共通ゲーム情報
export interface CommonGame {
  appId: number;
  name: string;
  user1Playtime: number;
  user2Playtime: number;
  compatibilityFactor: number;
  isCoopSupported?: boolean;
  genres?: string[];
}

// ジャンル相性情報
export interface GenreCompatibility {
  genre: string;
  user1Count: number;
  user2Count: number;
  commonCount: number;
  compatibilityScore: number;
}

// プレイ時間相性情報
export interface PlaytimeCompatibility {
  averagePlaytimeDifference: number;
  playtimeCorrelation: number;
  similarPlaytimeGames: number;
  totalCommonPlaytime: number;
}

// ゲーム推奨情報
export interface GameRecommendation {
  appId: number;
  name: string;
  recommendationScore: number;
  reason: string;
  genres: string[];
  estimatedPlaytime: number;
}

// 相性分析結果
export interface CompatibilityResult {
  score: number; // 0-100の相性スコア
  commonGames: CommonGame[];
  genreCompatibility: GenreCompatibility[];
  playtimeCompatibility: PlaytimeCompatibility;
  recommendations: GameRecommendation[];
  coopSuggestions: CoopGameSuggestion[];
  analysisDate: Date;
  user1SteamId: string;
  user2SteamId: string;
}

// 相性分析設定
export interface CompatibilityAnalysisConfig {
  weights: {
    commonGames: number;
    genreCompatibility: number;
    playtimeCompatibility: number;
    coopBonus: number;
  };
  minPlaytimeForAnalysis: number;
  maxRecommendations: number;
  maxCoopSuggestions: number;
}

// 相性分析エラー
export interface CompatibilityAnalysisError {
  type: 'INSUFFICIENT_DATA' | 'PRIVATE_PROFILE' | 'API_ERROR' | 'CALCULATION_ERROR';
  message: string;
  details?: any;
}