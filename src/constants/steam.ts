// Steam API関連の定数

// Steam API エンドポイント
export const STEAM_API_ENDPOINTS = {
  BASE_URL: 'https://api.steampowered.com',
  GET_OWNED_GAMES: '/IPlayerService/GetOwnedGames/v0001/',
  GET_PLAYER_SUMMARIES: '/ISteamUser/GetPlayerSummaries/v0002/',
  RESOLVE_VANITY_URL: '/ISteamUser/ResolveVanityURL/v0001/',
} as const;

// Steam OpenID関連
export const STEAM_OPENID = {
  PROVIDER_URL: 'https://steamcommunity.com/openid',
  NAMESPACE: 'http://specs.openid.net/auth/2.0',
  IDENTIFIER: 'https://steamcommunity.com/openid/id/',
} as const;

// Steam プロフィール可視性状態
export const STEAM_VISIBILITY_STATE = {
  PRIVATE: 1,
  FRIENDS_ONLY: 2,
  PUBLIC: 3,
} as const;

// API制限とタイムアウト
export const API_LIMITS = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 10000,
  RATE_LIMIT_DELAY_MS: 1000,
} as const;

// キャッシュ設定
export const CACHE_CONFIG = {
  USER_PROFILE_TTL_MS: 5 * 60 * 1000, // 5分
  GAME_LIBRARY_TTL_MS: 10 * 60 * 1000, // 10分
  ANALYSIS_RESULT_TTL_MS: 30 * 60 * 1000, // 30分
} as const;

// 相性分析設定
export const COMPATIBILITY_CONFIG = {
  DEFAULT_WEIGHTS: {
    commonGames: 0.35,
    genreCompatibility: 0.25,
    playtimeCompatibility: 0.25,
    coopBonus: 0.15,
  },
  MIN_PLAYTIME_FOR_ANALYSIS: 60, // 1時間（分単位）
  MAX_RECOMMENDATIONS: 10,
  MAX_COOP_SUGGESTIONS: 8,
} as const;