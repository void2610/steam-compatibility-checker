// Steam API関連の型定義

// Steam ユーザー情報
export interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
  communityVisibilityState: number;
}

// Steam認証コンテキスト
export interface SteamAuthContext {
  user: SteamUser | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// ゲーム情報
export interface Game {
  appId: number;
  name: string;
  playtimeForever: number;
  playtime2Weeks?: number;
  imgIconUrl?: string;
  genres?: string[];
}

// ゲームライブラリ
export interface GameLibrary {
  games: Game[];
  totalCount: number;
  isPublic: boolean;
}

// Steam API レスポンス型定義

// GetOwnedGames APIレスポンス
export interface GetOwnedGamesResponse {
  response: {
    game_count: number;
    games: Array<{
      appid: number;
      name?: string;
      playtime_forever: number;
      playtime_2weeks?: number;
      img_icon_url?: string;
    }>;
  };
}

// GetPlayerSummaries APIレスポンス
export interface GetPlayerSummariesResponse {
  response: {
    players: Array<{
      steamid: string;
      personaname: string;
      avatar: string;
      avatarmedium: string;
      avatarfull: string;
      profileurl: string;
      communityvisibilitystate: number;
    }>;
  };
}

// ResolveVanityURL APIレスポンス
export interface ResolveVanityUrlResponse {
  response: {
    steamid?: string;
    success: number;
    message?: string;
  };
}

// Steam API エラー型
export interface SteamApiError {
  code: string;
  message: string;
  retryable: boolean;
}

// Steam API設定
export interface SteamApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}