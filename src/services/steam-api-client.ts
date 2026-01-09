import { GameLibrary, SteamUser } from '@/types/steam';

/**
 * クライアントサイド用Steam APIサービス
 * CORSプロキシを使用してSteam APIにアクセス
 */
export class SteamApiClientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.allorigins.win/raw?url=';
  }

  /**
   * ユーザーの所有ゲーム一覧を取得
   */
  async getOwnedGames(
    steamId: string,
    includeAppInfo: boolean = true,
    includePlayedFreeGames: boolean = true
  ): Promise<GameLibrary> {
    const apiKey = process.env.NEXT_PUBLIC_STEAM_API_KEY;
    if (!apiKey) {
      throw new Error('Steam API key is not configured');
    }

    const steamApiUrl = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/');
    steamApiUrl.searchParams.set('key', apiKey);
    steamApiUrl.searchParams.set('steamid', steamId);
    steamApiUrl.searchParams.set('format', 'json');
    steamApiUrl.searchParams.set('include_appinfo', includeAppInfo ? '1' : '0');
    steamApiUrl.searchParams.set('include_played_free_games', includePlayedFreeGames ? '1' : '0');

    const proxyUrl = `${this.baseUrl}${encodeURIComponent(steamApiUrl.toString())}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch owned games');
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error('Invalid API response format');
    }

    // プロフィールが非公開の場合の検出
    if (!data.response.games) {
      return {
        games: [],
        totalCount: 0,
        isPublic: false
      };
    }

    const games = data.response.games.map((game: any) => ({
      appId: game.appid,
      name: game.name || `Game ${game.appid}`,
      playtimeForever: game.playtime_forever,
      playtime2Weeks: game.playtime_2weeks,
      imgIconUrl: game.img_icon_url
    }));

    return {
      games,
      totalCount: data.response.game_count,
      isPublic: true
    };
  }

  /**
   * プレイヤーのサマリー情報を取得
   */
  async getPlayerSummaries(steamIds: string[]): Promise<SteamUser[]> {
    const apiKey = process.env.NEXT_PUBLIC_STEAM_API_KEY;
    if (!apiKey) {
      throw new Error('Steam API key is not configured');
    }

    const steamApiUrl = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/');
    steamApiUrl.searchParams.set('key', apiKey);
    steamApiUrl.searchParams.set('steamids', steamIds.join(','));
    steamApiUrl.searchParams.set('format', 'json');

    const proxyUrl = `${this.baseUrl}${encodeURIComponent(steamApiUrl.toString())}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch player summaries');
    }

    const data = await response.json();
    
    if (!data.response || !data.response.players) {
      throw new Error('Invalid API response format');
    }

    return data.response.players.map((player: any) => ({
      steamId: player.steamid,
      personaName: player.personaname,
      avatarUrl: player.avatarfull,
      profileUrl: player.profileurl,
      communityVisibilityState: player.communityvisibilitystate
    }));
  }

  /**
   * バニティURLからSteam IDを解決
   */
  async resolveVanityUrl(vanityUrl: string, urlType: number = 1): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_STEAM_API_KEY;
    if (!apiKey) {
      throw new Error('Steam API key is not configured');
    }

    const steamApiUrl = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/');
    steamApiUrl.searchParams.set('key', apiKey);
    steamApiUrl.searchParams.set('vanityurl', vanityUrl);
    steamApiUrl.searchParams.set('url_type', urlType.toString());
    steamApiUrl.searchParams.set('format', 'json');

    const proxyUrl = `${this.baseUrl}${encodeURIComponent(steamApiUrl.toString())}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Failed to resolve vanity URL');
    }

    const data = await response.json();
    
    if (!data.response || data.response.success !== 1 || !data.response.steamid) {
      throw new Error(data.response?.message || 'Vanity URL not found');
    }

    return data.response.steamid;
  }

  /**
   * Steam IDまたはプロフィールURLからSteam IDを抽出/解決
   */
  async resolveSteamId(input: string): Promise<string> {
    const trimmedInput = input.trim();

    // 既にSteam ID（17桁の数字）の場合
    if (/^\d{17}$/.test(trimmedInput)) {
      return trimmedInput;
    }

    // プロフィールURLからSteam IDを抽出
    const steamIdMatch = trimmedInput.match(/\/profiles\/(\d{17})/);
    if (steamIdMatch) {
      return steamIdMatch[1];
    }

    // バニティURLの場合は解決
    const vanityUrl = this.extractVanityUrl(trimmedInput);
    if (vanityUrl) {
      return await this.resolveVanityUrl(vanityUrl);
    }

    throw new Error('Invalid Steam ID or profile URL format');
  }

  /**
   * URLからバニティURL部分を抽出
   */
  private extractVanityUrl(input: string): string {
    // フルURLからバニティURL部分を抽出
    const vanityMatch = input.match(/\/id\/([^\/\?]+)/);
    if (vanityMatch) {
      return vanityMatch[1];
    }

    // 既にバニティURLの場合（英数字とアンダースコア、ハイフンのみ）
    if (/^[a-zA-Z0-9_-]+$/.test(input)) {
      return input;
    }

    return input;
  }
}

// デフォルトインスタンス
export const steamApiClientService = new SteamApiClientService();