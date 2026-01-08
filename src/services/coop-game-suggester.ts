import { CoopGameSuggestion, CoopGameFilter, CoopGameStats } from '@/types/coop';
import { CommonGame } from '@/types/compatibility';
import { Game } from '@/types/steam';
import { getCoopGameInfo, getAllCoopGames, getPopularCoopGames } from '@/data/coop-games';

/**
 * co-opゲーム提案サービス
 * 共通ゲームやユーザーの嗜好に基づいてco-opゲームを提案
 */
export class CoopGameSuggester {
  private maxSuggestions: number;

  constructor(maxSuggestions: number = 8) {
    this.maxSuggestions = maxSuggestions;
  }

  /**
   * co-opゲーム提案を生成
   * @param commonGames 共通ゲーム一覧
   * @param user1Games ユーザー1のゲーム一覧
   * @param user2Games ユーザー2のゲーム一覧
   * @param filter フィルター条件
   * @returns co-opゲーム提案一覧
   */
  generateSuggestions(
    commonGames: CommonGame[],
    user1Games: Game[],
    user2Games: Game[],
    filter?: CoopGameFilter
  ): CoopGameSuggestion[] {
    const suggestions: CoopGameSuggestion[] = [];

    // 1. 共通ゲームからco-op対応ゲームを抽出
    const coopCommonGames = this.extractCoopFromCommonGames(commonGames);
    suggestions.push(...coopCommonGames);

    // 2. ユーザーの嗜好に基づく新しいco-opゲーム提案
    const preferenceBasedSuggestions = this.generatePreferenceBasedSuggestions(
      user1Games,
      user2Games,
      commonGames
    );
    suggestions.push(...preferenceBasedSuggestions);

    // 3. 人気co-opゲームからの提案
    const popularSuggestions = this.generatePopularGameSuggestions(
      user1Games,
      user2Games,
      suggestions.map(s => s.appId)
    );
    suggestions.push(...popularSuggestions);

    // フィルター適用
    let filteredSuggestions = this.applyFilter(suggestions, filter);

    // 重複除去とスコアソート
    filteredSuggestions = this.removeDuplicatesAndSort(filteredSuggestions);

    return filteredSuggestions.slice(0, this.maxSuggestions);
  }

  /**
   * 共通ゲームからco-op対応ゲームを抽出
   * @param commonGames 共通ゲーム一覧
   * @returns co-opゲーム提案一覧
   */
  private extractCoopFromCommonGames(commonGames: CommonGame[]): CoopGameSuggestion[] {
    const coopSuggestions: CoopGameSuggestion[] = [];

    for (const game of commonGames) {
      const coopInfo = getCoopGameInfo(game.appId);
      if (coopInfo) {
        // 共通ゲームのco-opは高スコア
        const compatibilityScore = Math.min(95, 70 + (game.compatibilityFactor * 25));
        
        coopSuggestions.push({
          appId: game.appId,
          name: game.name,
          coopType: coopInfo.coopType,
          maxPlayers: coopInfo.maxPlayers,
          description: coopInfo.description,
          steamUrl: coopInfo.steamUrl,
          compatibilityScore,
          recommendationReason: `既に両方が所有している${coopInfo.coopType === 'both' ? 'ローカル・オンライン' : coopInfo.coopType === 'local' ? 'ローカル' : 'オンライン'}co-opゲーム`,
          bothOwnGame: true
        });
      }
    }

    return coopSuggestions;
  }

  /**
   * ユーザーの嗜好に基づくco-opゲーム提案を生成
   * @param user1Games ユーザー1のゲーム一覧
   * @param user2Games ユーザー2のゲーム一覧
   * @param commonGames 共通ゲーム一覧
   * @returns co-opゲーム提案一覧
   */
  private generatePreferenceBasedSuggestions(
    user1Games: Game[],
    user2Games: Game[],
    commonGames: CommonGame[]
  ): CoopGameSuggestion[] {
    const suggestions: CoopGameSuggestion[] = [];
    const ownedGameIds = new Set([
      ...user1Games.map(g => g.appId),
      ...user2Games.map(g => g.appId)
    ]);

    // ユーザーの好みジャンルを分析
    const preferredGenres = this.analyzePreferredGenres(user1Games, user2Games, commonGames);
    
    // 全co-opゲームから嗜好に合うものを検索
    const allCoopGames = getAllCoopGames();
    
    for (const coopGame of allCoopGames) {
      // 既に所有しているゲームはスキップ
      if (ownedGameIds.has(coopGame.appId)) continue;

      // ジャンル一致度を計算
      const genreMatchScore = this.calculateGenreMatchScore(coopGame.genres, preferredGenres);
      
      if (genreMatchScore > 0.3) { // 30%以上の一致度
        const compatibilityScore = Math.min(90, 40 + (genreMatchScore * 50));
        
        suggestions.push({
          appId: coopGame.appId,
          name: coopGame.name,
          coopType: coopGame.coopType,
          maxPlayers: coopGame.maxPlayers,
          description: coopGame.description,
          steamUrl: coopGame.steamUrl,
          compatibilityScore,
          recommendationReason: `あなたたちの好みに合う${this.getCoopTypeText(coopGame.coopType)}co-opゲーム`,
          bothOwnGame: false
        });
      }
    }

    return suggestions;
  }

  /**
   * 人気co-opゲームからの提案を生成
   * @param user1Games ユーザー1のゲーム一覧
   * @param user2Games ユーザー2のゲーム一覧
   * @param excludeAppIds 除外するApp ID一覧
   * @returns co-opゲーム提案一覧
   */
  private generatePopularGameSuggestions(
    user1Games: Game[],
    user2Games: Game[],
    excludeAppIds: number[]
  ): CoopGameSuggestion[] {
    const suggestions: CoopGameSuggestion[] = [];
    const ownedGameIds = new Set([
      ...user1Games.map(g => g.appId),
      ...user2Games.map(g => g.appId)
    ]);
    const excludeSet = new Set(excludeAppIds);

    const popularCoopGames = getPopularCoopGames();
    
    for (const coopGame of popularCoopGames) {
      // 既に所有または提案済みのゲームはスキップ
      if (ownedGameIds.has(coopGame.appId) || excludeSet.has(coopGame.appId)) continue;

      // 人気ゲームは中程度のスコア
      const compatibilityScore = 60;
      
      suggestions.push({
        appId: coopGame.appId,
        name: coopGame.name,
        coopType: coopGame.coopType,
        maxPlayers: coopGame.maxPlayers,
        description: coopGame.description,
        steamUrl: coopGame.steamUrl,
        compatibilityScore,
        recommendationReason: `人気の${this.getCoopTypeText(coopGame.coopType)}co-opゲーム`,
        bothOwnGame: false
      });
    }

    return suggestions;
  }

  /**
   * ユーザーの好みジャンルを分析
   * @param user1Games ユーザー1のゲーム一覧
   * @param user2Games ユーザー2のゲーム一覧
   * @param commonGames 共通ゲーム一覧
   * @returns ジャンル重み付けマップ
   */
  private analyzePreferredGenres(
    user1Games: Game[],
    user2Games: Game[],
    commonGames: CommonGame[]
  ): Map<string, number> {
    const genreWeights = new Map<string, number>();

    // 共通ゲームのジャンルに高い重み
    for (const game of commonGames) {
      if (game.genres) {
        for (const genre of game.genres) {
          const currentWeight = genreWeights.get(genre) || 0;
          genreWeights.set(genre, currentWeight + (game.compatibilityFactor * 3));
        }
      }
    }

    // プレイ時間の長いゲームのジャンルに重み追加
    const allGames = [...user1Games, ...user2Games];
    for (const game of allGames) {
      if (game.genres && game.playtimeForever > 60) { // 1時間以上
        const playtimeWeight = Math.min(2, game.playtimeForever / 300); // 5時間で最大重み
        for (const genre of game.genres) {
          const currentWeight = genreWeights.get(genre) || 0;
          genreWeights.set(genre, currentWeight + playtimeWeight);
        }
      }
    }

    return genreWeights;
  }

  /**
   * ジャンル一致スコアを計算
   * @param gameGenres ゲームのジャンル一覧
   * @param preferredGenres 好みジャンルの重み付けマップ
   * @returns 一致スコア（0-1）
   */
  private calculateGenreMatchScore(gameGenres: string[], preferredGenres: Map<string, number>): number {
    if (gameGenres.length === 0 || preferredGenres.size === 0) return 0;

    let totalWeight = 0;
    let matchWeight = 0;

    // 全ジャンルの重みの合計を計算
    for (const weight of preferredGenres.values()) {
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    // マッチするジャンルの重みを計算
    for (const genre of gameGenres) {
      const weight = preferredGenres.get(genre) || 0;
      matchWeight += weight;
    }

    return matchWeight / totalWeight;
  }

  /**
   * co-opタイプのテキスト表現を取得
   * @param coopType co-opタイプ
   * @returns テキスト表現
   */
  private getCoopTypeText(coopType: 'local' | 'online' | 'both'): string {
    switch (coopType) {
      case 'local': return 'ローカル';
      case 'online': return 'オンライン';
      case 'both': return 'ローカル・オンライン';
      default: return '';
    }
  }

  /**
   * フィルターを適用
   * @param suggestions co-opゲーム提案一覧
   * @param filter フィルター条件
   * @returns フィルター適用後の提案一覧
   */
  private applyFilter(suggestions: CoopGameSuggestion[], filter?: CoopGameFilter): CoopGameSuggestion[] {
    if (!filter) return suggestions;

    return suggestions.filter(suggestion => {
      // co-opタイプフィルター
      if (filter.coopType && suggestion.coopType !== filter.coopType && suggestion.coopType !== 'both') {
        return false;
      }

      // 最大プレイヤー数フィルター
      if (filter.maxPlayers && suggestion.maxPlayers < filter.maxPlayers) {
        return false;
      }

      // ジャンルフィルター
      if (filter.genres && filter.genres.length > 0) {
        const coopInfo = getCoopGameInfo(suggestion.appId);
        if (!coopInfo || !filter.genres.some(genre => coopInfo.genres.includes(genre))) {
          return false;
        }
      }

      // 最小相性スコアフィルター
      if (filter.minCompatibilityScore && suggestion.compatibilityScore < filter.minCompatibilityScore) {
        return false;
      }

      return true;
    });
  }

  /**
   * 重複除去とスコアソート
   * @param suggestions co-opゲーム提案一覧
   * @returns 重複除去・ソート済み提案一覧
   */
  private removeDuplicatesAndSort(suggestions: CoopGameSuggestion[]): CoopGameSuggestion[] {
    // App IDで重複除去（高スコアを優先）
    const uniqueSuggestions = new Map<number, CoopGameSuggestion>();
    
    for (const suggestion of suggestions) {
      const existing = uniqueSuggestions.get(suggestion.appId);
      if (!existing || suggestion.compatibilityScore > existing.compatibilityScore) {
        uniqueSuggestions.set(suggestion.appId, suggestion);
      }
    }

    // スコアでソート（降順）
    return Array.from(uniqueSuggestions.values())
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * co-opゲーム統計を取得
   * @returns co-opゲーム統計
   */
  getCoopGameStats(): CoopGameStats {
    const allCoopGames = getAllCoopGames();
    
    const stats: CoopGameStats = {
      totalCoopGames: allCoopGames.length,
      localCoopGames: 0,
      onlineCoopGames: 0,
      bothCoopGames: 0,
      averageMaxPlayers: 0,
      popularGenres: []
    };

    let totalMaxPlayers = 0;
    const genreCounts = new Map<string, number>();

    for (const game of allCoopGames) {
      // co-opタイプ別カウント
      switch (game.coopType) {
        case 'local':
          stats.localCoopGames++;
          break;
        case 'online':
          stats.onlineCoopGames++;
          break;
        case 'both':
          stats.bothCoopGames++;
          break;
      }

      // 最大プレイヤー数の合計
      totalMaxPlayers += game.maxPlayers;

      // ジャンル集計
      for (const genre of game.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      }
    }

    // 平均最大プレイヤー数
    stats.averageMaxPlayers = allCoopGames.length > 0 ? totalMaxPlayers / allCoopGames.length : 0;

    // 人気ジャンル（上位5つ）
    stats.popularGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    return stats;
  }

  /**
   * 指定されたApp IDがco-opゲームかどうかを判定
   * @param appId Steam App ID
   * @returns co-opゲームの場合true
   */
  isCoopGame(appId: number): boolean {
    return getCoopGameInfo(appId) !== undefined;
  }
}

// デフォルトインスタンス
export const coopGameSuggester = new CoopGameSuggester();