/**
 * セッション中キャッシュ管理システム
 * APIレスポンスのメモリキャッシュと重複リクエストの回避を担当
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
}

export interface CacheConfig {
  maxEntries: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableStats: boolean;
}

/**
 * LRU（Least Recently Used）キャッシュマネージャー
 */
export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };
  private cleanupTimer?: NodeJS.Timeout;
  private pendingRequests: Map<string, Promise<any>>;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: 1000,
      defaultTtl: 300000, // 5分
      cleanupInterval: 60000, // 1分
      enableStats: true,
      ...config
    };

    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    this.pendingRequests = new Map();

    // 定期的なクリーンアップを開始
    this.startCleanupTimer();
  }

  /**
   * キャッシュから値を取得
   * @param key キャッシュキー
   * @returns キャッシュされた値またはnull
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // TTL チェック
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // アクセス情報を更新
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.config.enableStats) {
      this.stats.hits++;
    }

    return entry.data as T;
  }

  /**
   * キャッシュに値を設定
   * @param key キャッシュキー
   * @param data データ
   * @param ttl 生存時間（ミリ秒、オプション）
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl || this.config.defaultTtl;

    // 既存エントリがある場合は更新
    if (this.cache.has(key)) {
      const existingEntry = this.cache.get(key)!;
      existingEntry.data = data;
      existingEntry.timestamp = now;
      existingEntry.ttl = entryTtl;
      existingEntry.lastAccessed = now;
      return;
    }

    // 新しいエントリを作成
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTtl,
      accessCount: 0,
      lastAccessed: now
    };

    // キャッシュサイズ制限チェック
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
  }

  /**
   * キャッシュから値を削除
   * @param key キャッシュキー
   * @returns 削除されたかどうか
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * キャッシュに値が存在するかチェック
   * @param key キャッシュキー
   * @returns 存在するかどうか
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 重複リクエストを回避しながら値を取得または生成
   * @param key キャッシュキー
   * @param factory データ生成関数
   * @param ttl 生存時間（ミリ秒、オプション）
   * @returns データ
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // キャッシュから取得を試行
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 既に同じキーでリクエストが進行中かチェック
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }

    // 新しいリクエストを開始
    const request = factory().then(data => {
      // 成功時にキャッシュに保存
      this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      // エラー時はペンディングリクエストを削除
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    if (this.config.enableStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        evictions: 0
      };
    }
  }

  /**
   * 期限切れエントリをクリーンアップ
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * キャッシュ統計を取得
   * @returns キャッシュ統計
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.calculateCacheSize(),
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses
    };
  }

  /**
   * キャッシュ設定を更新
   * @param newConfig 新しい設定
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // クリーンアップタイマーを再設定
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.startCleanupTimer();
    }
  }

  /**
   * キャッシュを破棄
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  /**
   * エントリが期限切れかどうかをチェック
   * @param entry キャッシュエントリ
   * @returns 期限切れかどうか
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  /**
   * 最も最近使用されていないエントリを削除
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      if (this.config.enableStats) {
        this.stats.evictions++;
      }
    }
  }

  /**
   * キャッシュサイズを概算計算
   * @returns キャッシュサイズ（バイト）
   */
  private calculateCacheSize(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // キーのサイズ
      size += key.length * 2; // UTF-16
      
      // データのサイズ（概算）
      try {
        size += JSON.stringify(entry.data).length * 2;
      } catch {
        // JSON化できない場合は固定サイズを仮定
        size += 1000;
      }
      
      // メタデータのサイズ
      size += 64; // timestamp, ttl, accessCount, lastAccessed
    }
    
    return size;
  }

  /**
   * クリーンアップタイマーを開始
   */
  private startCleanupTimer(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }
}

/**
 * Steam API専用のキャッシュマネージャー
 */
export class SteamApiCacheManager extends CacheManager {
  constructor() {
    super({
      maxEntries: 500,
      defaultTtl: 600000, // 10分
      cleanupInterval: 300000, // 5分
      enableStats: true
    });
  }

  /**
   * ゲームライブラリキャッシュキーを生成
   * @param steamId Steam ID
   * @param includeAppInfo アプリ情報を含むか
   * @param includePlayedFreeGames 無料ゲームを含むか
   * @returns キャッシュキー
   */
  generateGameLibraryKey(
    steamId: string, 
    includeAppInfo: boolean = true, 
    includePlayedFreeGames: boolean = true
  ): string {
    return `games:${steamId}:${includeAppInfo}:${includePlayedFreeGames}`;
  }

  /**
   * プレイヤーサマリーキャッシュキーを生成
   * @param steamIds Steam ID配列
   * @returns キャッシュキー
   */
  generatePlayerSummaryKey(steamIds: string[]): string {
    return `players:${steamIds.sort().join(',')}`;
  }

  /**
   * バニティURL解決キャッシュキーを生成
   * @param vanityUrl バニティURL
   * @param urlType URLタイプ
   * @returns キャッシュキー
   */
  generateVanityUrlKey(vanityUrl: string, urlType: number = 1): string {
    return `vanity:${vanityUrl}:${urlType}`;
  }

  /**
   * Steam ID解決キャッシュキーを生成
   * @param input 入力文字列
   * @returns キャッシュキー
   */
  generateSteamIdKey(input: string): string {
    return `steamid:${input.trim()}`;
  }
}

/**
 * グローバルキャッシュインスタンス
 */
export const globalCacheManager = new CacheManager();
export const steamApiCacheManager = new SteamApiCacheManager();

/**
 * キャッシュデコレーター
 * 関数の結果をキャッシュする
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number,
  cacheManager: CacheManager = globalCacheManager
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator(...args);
      
      return cacheManager.getOrSet(
        key,
        () => method.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}

/**
 * キャッシュ無効化ユーティリティ
 */
export class CacheInvalidator {
  constructor(private cacheManager: CacheManager) {}

  /**
   * パターンに一致するキーを削除
   * @param pattern 削除パターン（正規表現）
   */
  invalidateByPattern(pattern: RegExp): number {
    let deletedCount = 0;
    
    for (const key of this.cacheManager['cache'].keys()) {
      if (pattern.test(key)) {
        this.cacheManager.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Steam IDに関連するすべてのキャッシュを削除
   * @param steamId Steam ID
   */
  invalidateBySteamId(steamId: string): number {
    const pattern = new RegExp(`(games|players|vanity|steamid):.*${steamId}`);
    return this.invalidateByPattern(pattern);
  }

  /**
   * 期限切れエントリを削除
   */
  invalidateExpired(): void {
    this.cacheManager.cleanup();
  }
}

/**
 * Steam API用キャッシュ無効化インスタンス
 */
export const steamApiCacheInvalidator = new CacheInvalidator(steamApiCacheManager);