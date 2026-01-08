import { 
  GameLibrary, 
  Game, 
  SteamUser, 
  GetOwnedGamesResponse, 
  GetPlayerSummariesResponse, 
  ResolveVanityUrlResponse,
  SteamApiErrorInfo,
  SteamApiConfig 
} from '@/types/steam';
import { env } from '@/lib/env';
import { 
  STEAM_API_ERROR_CODES,
  RetryStrategy,
  PrivateProfileDetector,
  ErrorReporter,
  mapHttpStatusToErrorCode,
  mapNetworkErrorToErrorCode,
  defaultRetryStrategy
} from '@/lib/steam-api-errors';
import { 
  SteamApiCacheManager, 
  steamApiCacheManager,
  CacheInvalidator,
  steamApiCacheInvalidator
} from '@/lib/cache-manager';

/**
 * Steam Web API サービスクラス
 * Steam APIとの通信を担当し、ゲームライブラリやプロフィール情報を取得する
 */
export class SteamApiService {
  private config: SteamApiConfig;
  private retryStrategy: RetryStrategy;
  private cacheManager: SteamApiCacheManager;
  private cacheInvalidator: CacheInvalidator;

  constructor(
    apiKey?: string, 
    retryStrategy?: RetryStrategy,
    cacheManager?: SteamApiCacheManager
  ) {
    this.config = {
      apiKey: apiKey || env.steamApiKey,
      baseUrl: 'https://api.steampowered.com',
      timeout: 10000,
      maxRetries: 3
    };
    this.retryStrategy = retryStrategy || defaultRetryStrategy;
    this.cacheManager = cacheManager || steamApiCacheManager;
    this.cacheInvalidator = new CacheInvalidator(this.cacheManager);
  }

  /**
   * ユーザーの所有ゲーム一覧を取得
   * @param steamId Steam ID (64bit)
   * @param includeAppInfo アプリ情報を含めるかどうか
   * @param includePlayedFreeGames 無料ゲームを含めるかどうか
   * @returns ゲームライブラリ情報
   */
  async getOwnedGames(
    steamId: string, 
    includeAppInfo: boolean = true, 
    includePlayedFreeGames: boolean = true
  ): Promise<GameLibrary> {
    if (!this.config.apiKey) {
      const error = new SteamApiError(
        STEAM_API_ERROR_CODES.MISSING_API_KEY, 
        'Steam API key is not configured', 
        false
      );
      ErrorReporter.logError(error, { steamId, includeAppInfo, includePlayedFreeGames });
      throw error;
    }

    const cacheKey = this.cacheManager.generateGameLibraryKey(steamId, includeAppInfo, includePlayedFreeGames);
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const url = new URL(`${this.config.baseUrl}/IPlayerService/GetOwnedGames/v0001/`);
        url.searchParams.set('key', this.config.apiKey);
        url.searchParams.set('steamid', steamId);
        url.searchParams.set('format', 'json');
        url.searchParams.set('include_appinfo', includeAppInfo ? '1' : '0');
        url.searchParams.set('include_played_free_games', includePlayedFreeGames ? '1' : '0');

        const response = await this.fetchWithRetry(url.toString());
        const data: GetOwnedGamesResponse = await response.json();

        if (!data.response) {
          const error = new SteamApiError(
            STEAM_API_ERROR_CODES.INVALID_RESPONSE, 
            'Invalid API response format', 
            true
          );
          ErrorReporter.logError(error, { steamId, responseData: data });
          throw error;
        }

        // プロフィールが非公開の場合の検出と処理
        if (PrivateProfileDetector.isPrivateProfile(data)) {
          const error = new SteamApiError(
            STEAM_API_ERROR_CODES.PRIVATE_PROFILE,
            'Profile is private',
            false
          );
          ErrorReporter.logError(error, { steamId });
          
          return {
            games: [],
            totalCount: 0,
            isPublic: false
          };
        }

        const games: Game[] = data.response.games.map(game => ({
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
      },
      600000 // 10分キャッシュ
    );
  }

  /**
   * プレイヤーのサマリー情報を取得
   * @param steamIds Steam ID配列（最大100個）
   * @returns プレイヤー情報配列
   */
  async getPlayerSummaries(steamIds: string[]): Promise<SteamUser[]> {
    if (!this.config.apiKey) {
      const error = new SteamApiError(
        STEAM_API_ERROR_CODES.MISSING_API_KEY, 
        'Steam API key is not configured', 
        false
      );
      ErrorReporter.logError(error, { steamIds });
      throw error;
    }

    if (steamIds.length === 0) {
      return [];
    }

    if (steamIds.length > 100) {
      const error = new SteamApiError(
        STEAM_API_ERROR_CODES.INVALID_STEAM_ID, 
        'Maximum 100 Steam IDs allowed per request', 
        false
      );
      ErrorReporter.logError(error, { steamIdsCount: steamIds.length });
      throw error;
    }

    const cacheKey = this.cacheManager.generatePlayerSummaryKey(steamIds);
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const url = new URL(`${this.config.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/`);
        url.searchParams.set('key', this.config.apiKey);
        url.searchParams.set('steamids', steamIds.join(','));
        url.searchParams.set('format', 'json');

        const response = await this.fetchWithRetry(url.toString());
        const data: GetPlayerSummariesResponse = await response.json();

        if (!data.response || !data.response.players) {
          const error = new SteamApiError(
            STEAM_API_ERROR_CODES.INVALID_RESPONSE, 
            'Invalid API response format', 
            true
          );
          ErrorReporter.logError(error, { steamIds, responseData: data });
          throw error;
        }

        return data.response.players.map(player => {
          // 非公開プロフィールの検出
          if (PrivateProfileDetector.isPrivateFromPlayerSummary(player)) {
            ErrorReporter.logError(
              new SteamApiError(STEAM_API_ERROR_CODES.PRIVATE_PROFILE, 'Private profile detected', false),
              { steamId: player.steamid }
            );
          }

          return {
            steamId: player.steamid,
            personaName: player.personaname,
            avatarUrl: player.avatarfull,
            profileUrl: player.profileurl,
            communityVisibilityState: player.communityvisibilitystate
          };
        });
      },
      300000 // 5分キャッシュ
    );
  }

  /**
   * バニティURLからSteam IDを解決
   * @param vanityUrl バニティURL（カスタムURL）
   * @param urlType URLタイプ（1: 個人, 2: グループ, 3: 公式ゲームグループ）
   * @returns Steam ID
   */
  async resolveVanityUrl(vanityUrl: string, urlType: number = 1): Promise<string> {
    if (!this.config.apiKey) {
      const error = new SteamApiError(
        STEAM_API_ERROR_CODES.MISSING_API_KEY, 
        'Steam API key is not configured', 
        false
      );
      ErrorReporter.logError(error, { vanityUrl, urlType });
      throw error;
    }

    // バニティURLから不要な部分を除去
    const cleanVanityUrl = this.extractVanityUrl(vanityUrl);
    const cacheKey = this.cacheManager.generateVanityUrlKey(cleanVanityUrl, urlType);
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const url = new URL(`${this.config.baseUrl}/ISteamUser/ResolveVanityURL/v0001/`);
        url.searchParams.set('key', this.config.apiKey);
        url.searchParams.set('vanityurl', cleanVanityUrl);
        url.searchParams.set('url_type', urlType.toString());
        url.searchParams.set('format', 'json');

        const response = await this.fetchWithRetry(url.toString());
        const data: ResolveVanityUrlResponse = await response.json();

        if (!data.response) {
          const error = new SteamApiError(
            STEAM_API_ERROR_CODES.INVALID_RESPONSE, 
            'Invalid API response format', 
            true
          );
          ErrorReporter.logError(error, { vanityUrl, responseData: data });
          throw error;
        }

        if (data.response.success !== 1 || !data.response.steamid) {
          const error = new SteamApiError(
            STEAM_API_ERROR_CODES.VANITY_URL_NOT_FOUND, 
            data.response.message || 'Vanity URL not found', 
            false
          );
          ErrorReporter.logError(error, { vanityUrl, cleanVanityUrl, response: data.response });
          throw error;
        }

        return data.response.steamid;
      },
      3600000 // 1時間キャッシュ
    );
  }

  /**
   * Steam IDまたはプロフィールURLからSteam IDを抽出/解決
   * @param input Steam IDまたはプロフィールURL
   * @returns Steam ID
   */
  async resolveSteamId(input: string): Promise<string> {
    const trimmedInput = input.trim();
    const cacheKey = this.cacheManager.generateSteamIdKey(trimmedInput);
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
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

        const error = new SteamApiError(
          STEAM_API_ERROR_CODES.INVALID_STEAM_ID, 
          'Invalid Steam ID or profile URL format', 
          false
        );
        ErrorReporter.logError(error, { input: trimmedInput });
        throw error;
      },
      1800000 // 30分キャッシュ
    );
  }

  /**
   * URLからバニティURL部分を抽出
   * @param input 入力文字列
   * @returns バニティURL
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

  /**
   * 再試行機能付きのfetch
   * @param url リクエストURL
   * @param retryCount 現在の再試行回数
   * @returns Response
   */
  private async fetchWithRetry(url: string, attemptCount: number = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Steam-Compatibility-Checker/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorCode = mapHttpStatusToErrorCode(response.status);
        const error = new SteamApiError(errorCode, `HTTP error: ${response.status}`, errorCode !== STEAM_API_ERROR_CODES.INVALID_API_KEY);
        
        ErrorReporter.logError(error, { 
          url, 
          status: response.status, 
          attemptCount,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        throw error;
      }

      return response;

    } catch (error) {
      const isRetryableError = error instanceof SteamApiError ? 
        error.retryable : 
        this.retryStrategy.shouldRetry(error, attemptCount);

      if (isRetryableError && attemptCount < this.config.maxRetries) {
        const errorCode = error instanceof SteamApiError ? 
          error.code : 
          mapNetworkErrorToErrorCode(error);
        
        const delay = this.retryStrategy.calculateDelay(attemptCount + 1, errorCode);
        
        ErrorReporter.logError(error, { 
          url, 
          attemptCount, 
          retryDelay: delay,
          willRetry: true 
        });
        
        await this.retryStrategy.delay(delay);
        return this.fetchWithRetry(url, attemptCount + 1);
      }

      // 最終的な失敗
      if (!(error instanceof SteamApiError)) {
        const errorCode = mapNetworkErrorToErrorCode(error);
        const steamError = new SteamApiError(errorCode, (error as Error).message || 'Network error', false);
        ErrorReporter.logError(steamError, { url, attemptCount, originalError: error });
        throw steamError;
      }

      throw error;
    }
  }

  /**
   * キャッシュ統計を取得
   * @returns キャッシュ統計
   */
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * 特定のSteam IDに関連するキャッシュを無効化
   * @param steamId Steam ID
   */
  invalidateCacheForSteamId(steamId: string): void {
    this.cacheInvalidator.invalidateBySteamId(steamId);
  }

  /**
   * 期限切れキャッシュエントリを削除
   */
  cleanupExpiredCache(): void {
    this.cacheInvalidator.invalidateExpired();
  }
}

/**
 * Steam API エラークラス
 */
export class SteamApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = 'SteamApiError';
  }
}

// デフォルトインスタンス
export const steamApiService = new SteamApiService();