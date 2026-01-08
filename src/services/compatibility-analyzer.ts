import {
  CompatibilityResult,
  CommonGame,
  GenreCompatibility,
  PlaytimeCompatibility,
  GameRecommendation,
  CompatibilityAnalysisConfig,
  CompatibilityAnalysisError
} from '@/types/compatibility';
import { GameLibrary, Game } from '@/types/steam';
import { CoopGameSuggestion, CoopGameFilter } from '@/types/coop';
import { CoopGameSuggester } from './coop-game-suggester';

/**
 * 相性分析エンジン
 * 2つのゲームライブラリを比較して相性スコアと詳細分析を提供
 */
export class CompatibilityAnalyzer {
  private config: CompatibilityAnalysisConfig;
  private coopSuggester: CoopGameSuggester;

  constructor(config?: Partial<CompatibilityAnalysisConfig>) {
    this.config = {
      weights: {
        commonGames: 0.35,
        genreCompatibility: 0.25,
        playtimeCompatibility: 0.25,
        coopBonus: 0.15
      },
      minPlaytimeForAnalysis: 30, // 30分以上プレイしたゲームのみ分析対象
      maxRecommendations: 10,
      maxCoopSuggestions: 8,
      ...config
    };
    this.coopSuggester = new CoopGameSuggester(this.config.maxCoopSuggestions);
  }

  /**
   * 相性分析を実行
   * @param library1 ユーザー1のゲームライブラリ
   * @param library2 ユーザー2のゲームライブラリ
   * @param user1SteamId ユーザー1のSteam ID
   * @param user2SteamId ユーザー2のSteam ID
   * @param coopFilter co-opゲームフィルター（オプション）
   * @returns 相性分析結果
   */
  analyze(
    library1: GameLibrary,
    library2: GameLibrary,
    user1SteamId: string,
    user2SteamId: string,
    coopFilter?: CoopGameFilter
  ): CompatibilityResult {
    // 入力検証
    this.validateInputs(library1, library2);

    // 共通ゲームの検出
    const commonGames = this.findCommonGames(library1.games, library2.games);

    // 各種相性分析
    const genreCompatibility = this.analyzeGenreCompatibility(library1.games, library2.games);
    const playtimeCompatibility = this.calculatePlaytimeCompatibility(commonGames);
    
    // co-opゲーム提案の生成
    const coopSuggestions = this.coopSuggester.generateSuggestions(
      commonGames,
      library1.games,
      library2.games,
      coopFilter
    );
    
    // 基本相性スコアの計算
    const baseScore = this.calculateBaseScore(commonGames, library1.games.length, library2.games.length);
    const genreScore = this.calculateGenreScore(genreCompatibility);
    const playtimeScore = this.calculatePlaytimeScore(playtimeCompatibility);
    const coopBonus = this.calculateCoopBonus(coopSuggestions);
    
    // 最終相性スコアの計算
    const finalScore = Math.min(100, Math.max(0, 
      baseScore * this.config.weights.commonGames +
      genreScore * this.config.weights.genreCompatibility +
      playtimeScore * this.config.weights.playtimeCompatibility +
      coopBonus * this.config.weights.coopBonus
    ));

    // ゲーム推奨の生成
    const recommendations = this.generateRecommendations(library1.games, library2.games, commonGames);

    return {
      score: Math.round(finalScore),
      commonGames,
      genreCompatibility,
      playtimeCompatibility,
      recommendations,
      coopSuggestions,
      analysisDate: new Date(),
      user1SteamId,
      user2SteamId
    };
  }

  /**
   * 共通ゲームを検出
   * @param games1 ユーザー1のゲーム一覧
   * @param games2 ユーザー2のゲーム一覧
   * @returns 共通ゲーム一覧
   */
  private findCommonGames(games1: Game[], games2: Game[]): CommonGame[] {
    const games2Map = new Map(games2.map(game => [game.appId, game]));
    const commonGames: CommonGame[] = [];

    for (const game1 of games1) {
      const game2 = games2Map.get(game1.appId);
      if (game2) {
        // 相性ファクターの計算（プレイ時間の類似度に基づく）
        const compatibilityFactor = this.calculateGameCompatibilityFactor(
          game1.playtimeForever,
          game2.playtimeForever
        );

        // co-op対応チェック
        const isCoopSupported = this.coopSuggester.isCoopGame(game1.appId);

        commonGames.push({
          appId: game1.appId,
          name: game1.name,
          user1Playtime: game1.playtimeForever,
          user2Playtime: game2.playtimeForever,
          compatibilityFactor,
          isCoopSupported,
          genres: game1.genres || []
        });
      }
    }

    // 相性ファクターでソート（降順）
    return commonGames.sort((a, b) => b.compatibilityFactor - a.compatibilityFactor);
  }

  /**
   * ゲーム単体の相性ファクターを計算
   * @param playtime1 ユーザー1のプレイ時間（分）
   * @param playtime2 ユーザー2のプレイ時間（分）
   * @returns 相性ファクター（0-1）
   */
  private calculateGameCompatibilityFactor(playtime1: number, playtime2: number): number {
    // 両方とも最小プレイ時間未満の場合は低スコア
    if (playtime1 < this.config.minPlaytimeForAnalysis && playtime2 < this.config.minPlaytimeForAnalysis) {
      return 0.1;
    }

    // 片方だけが最小プレイ時間未満の場合は中程度のスコア
    if (playtime1 < this.config.minPlaytimeForAnalysis || playtime2 < this.config.minPlaytimeForAnalysis) {
      return 0.4;
    }

    // プレイ時間の類似度を計算
    const maxPlaytime = Math.max(playtime1, playtime2);
    const minPlaytime = Math.min(playtime1, playtime2);
    
    if (maxPlaytime === 0) return 0.1;
    
    const similarity = minPlaytime / maxPlaytime;
    
    // プレイ時間の絶対値も考慮（長時間プレイしているゲームほど高スコア）
    const playtimeBonus = Math.min(1, (playtime1 + playtime2) / (60 * 20)); // 20時間で最大ボーナス
    
    return Math.min(1, similarity * 0.7 + playtimeBonus * 0.3);
  }

  /**
   * ジャンル相性を分析
   * @param games1 ユーザー1のゲーム一覧
   * @param games2 ユーザー2のゲーム一覧
   * @returns ジャンル相性一覧
   */
  private analyzeGenreCompatibility(games1: Game[], games2: Game[]): GenreCompatibility[] {
    const genre1Count = new Map<string, number>();
    const genre2Count = new Map<string, number>();
    const allGenres = new Set<string>();

    // ユーザー1のジャンル集計
    for (const game of games1) {
      if (game.genres && game.playtimeForever >= this.config.minPlaytimeForAnalysis) {
        for (const genre of game.genres) {
          genre1Count.set(genre, (genre1Count.get(genre) || 0) + 1);
          allGenres.add(genre);
        }
      }
    }

    // ユーザー2のジャンル集計
    for (const game of games2) {
      if (game.genres && game.playtimeForever >= this.config.minPlaytimeForAnalysis) {
        for (const genre of game.genres) {
          genre2Count.set(genre, (genre2Count.get(genre) || 0) + 1);
          allGenres.add(genre);
        }
      }
    }

    const genreCompatibility: GenreCompatibility[] = [];

    for (const genre of allGenres) {
      const user1Count = genre1Count.get(genre) || 0;
      const user2Count = genre2Count.get(genre) || 0;
      const commonCount = Math.min(user1Count, user2Count);
      
      // ジャンル相性スコア計算
      const maxCount = Math.max(user1Count, user2Count);
      const compatibilityScore = maxCount > 0 ? (commonCount / maxCount) * 100 : 0;

      if (user1Count > 0 || user2Count > 0) {
        genreCompatibility.push({
          genre,
          user1Count,
          user2Count,
          commonCount,
          compatibilityScore
        });
      }
    }

    // 相性スコアでソート（降順）
    return genreCompatibility.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * プレイ時間相性を計算
   * @param commonGames 共通ゲーム一覧
   * @returns プレイ時間相性情報
   */
  private calculatePlaytimeCompatibility(commonGames: CommonGame[]): PlaytimeCompatibility {
    if (commonGames.length === 0) {
      return {
        averagePlaytimeDifference: 0,
        playtimeCorrelation: 0,
        similarPlaytimeGames: 0,
        totalCommonPlaytime: 0
      };
    }

    let totalDifference = 0;
    let totalCommonPlaytime = 0;
    let similarPlaytimeGames = 0;
    
    const playtimes1: number[] = [];
    const playtimes2: number[] = [];

    for (const game of commonGames) {
      const difference = Math.abs(game.user1Playtime - game.user2Playtime);
      totalDifference += difference;
      totalCommonPlaytime += game.user1Playtime + game.user2Playtime;
      
      playtimes1.push(game.user1Playtime);
      playtimes2.push(game.user2Playtime);

      // 類似プレイ時間の判定（差が30%以内）
      const maxPlaytime = Math.max(game.user1Playtime, game.user2Playtime);
      if (maxPlaytime > 0 && difference / maxPlaytime <= 0.3) {
        similarPlaytimeGames++;
      }
    }

    const averagePlaytimeDifference = totalDifference / commonGames.length;
    const playtimeCorrelation = this.calculateCorrelation(playtimes1, playtimes2);

    return {
      averagePlaytimeDifference,
      playtimeCorrelation,
      similarPlaytimeGames,
      totalCommonPlaytime
    };
  }

  /**
   * 相関係数を計算
   * @param x 数値配列1
   * @param y 数値配列2
   * @returns 相関係数（-1から1）
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 基本相性スコアを計算
   * @param commonGames 共通ゲーム一覧
   * @param totalGames1 ユーザー1の総ゲーム数
   * @param totalGames2 ユーザー2の総ゲーム数
   * @returns 基本スコア（0-100）
   */
  private calculateBaseScore(commonGames: CommonGame[], totalGames1: number, totalGames2: number): number {
    if (totalGames1 === 0 || totalGames2 === 0) return 0;

    const averageTotalGames = (totalGames1 + totalGames2) / 2;
    const commonGameRatio = commonGames.length / averageTotalGames;
    
    // 共通ゲームの相性ファクター平均を考慮
    const averageCompatibilityFactor = commonGames.length > 0 
      ? commonGames.reduce((sum, game) => sum + game.compatibilityFactor, 0) / commonGames.length
      : 0;

    return Math.min(100, (commonGameRatio * 100 * 0.7) + (averageCompatibilityFactor * 100 * 0.3));
  }

  /**
   * ジャンル相性スコアを計算
   * @param genreCompatibility ジャンル相性一覧
   * @returns ジャンルスコア（0-100）
   */
  private calculateGenreScore(genreCompatibility: GenreCompatibility[]): number {
    if (genreCompatibility.length === 0) return 0;

    // 上位5ジャンルの平均スコアを使用
    const topGenres = genreCompatibility.slice(0, 5);
    const averageScore = topGenres.reduce((sum, genre) => sum + genre.compatibilityScore, 0) / topGenres.length;
    
    return Math.min(100, averageScore);
  }

  /**
   * プレイ時間相性スコアを計算
   * @param playtimeCompatibility プレイ時間相性情報
   * @returns プレイ時間スコア（0-100）
   */
  private calculatePlaytimeScore(playtimeCompatibility: PlaytimeCompatibility): number {
    // 相関係数を0-100スケールに変換
    const correlationScore = (playtimeCompatibility.playtimeCorrelation + 1) * 50;
    
    // 類似プレイ時間ゲームの割合
    const similarRatio = playtimeCompatibility.similarPlaytimeGames > 0 
      ? (playtimeCompatibility.similarPlaytimeGames / 10) * 100 // 最大10ゲームで100%
      : 0;

    return Math.min(100, (correlationScore * 0.6) + (similarRatio * 0.4));
  }

  /**
   * co-opボーナススコアを計算
   * @param coopSuggestions co-opゲーム提案一覧
   * @returns co-opボーナススコア（0-100）
   */
  private calculateCoopBonus(coopSuggestions: CoopGameSuggestion[]): number {
    if (coopSuggestions.length === 0) return 0;

    // 既に両方が所有しているco-opゲームの数
    const ownedCoopGames = coopSuggestions.filter(s => s.bothOwnGame).length;
    
    // 高スコアco-opゲームの数（スコア80以上）
    const highScoreCoopGames = coopSuggestions.filter(s => s.compatibilityScore >= 80).length;
    
    // ボーナス計算
    const ownedBonus = Math.min(50, ownedCoopGames * 15); // 所有co-opゲーム1つにつき15点、最大50点
    const qualityBonus = Math.min(30, highScoreCoopGames * 10); // 高品質提案1つにつき10点、最大30点
    const varietyBonus = Math.min(20, coopSuggestions.length * 3); // 提案数1つにつき3点、最大20点

    return Math.min(100, ownedBonus + qualityBonus + varietyBonus);
  }

  /**
   * ゲーム推奨を生成
   * @param games1 ユーザー1のゲーム一覧
   * @param games2 ユーザー2のゲーム一覧
   * @param commonGames 共通ゲーム一覧
   * @returns ゲーム推奨一覧
   */
  private generateRecommendations(
    games1: Game[],
    games2: Game[],
    commonGames: CommonGame[]
  ): GameRecommendation[] {
    const recommendations: GameRecommendation[] = [];
    const commonGameIds = new Set(commonGames.map(g => g.appId));

    // ユーザー1が持っていてユーザー2が持っていないゲーム
    const user1OnlyGames = games1.filter(game => 
      !commonGameIds.has(game.appId) && 
      game.playtimeForever >= this.config.minPlaytimeForAnalysis
    );

    // ユーザー2が持っていてユーザー1が持っていないゲーム
    const user2OnlyGames = games2.filter(game => 
      !commonGameIds.has(game.appId) && 
      game.playtimeForever >= this.config.minPlaytimeForAnalysis
    );

    // ユーザー1のゲームをユーザー2に推奨
    for (const game of user1OnlyGames.slice(0, this.config.maxRecommendations / 2)) {
      const score = this.calculateRecommendationScore(game, commonGames);
      recommendations.push({
        appId: game.appId,
        name: game.name,
        recommendationScore: score,
        reason: `${game.name}は相性の良いゲームです（プレイ時間: ${Math.round(game.playtimeForever / 60)}時間）`,
        genres: game.genres || [],
        estimatedPlaytime: game.playtimeForever
      });
    }

    // ユーザー2のゲームをユーザー1に推奨
    for (const game of user2OnlyGames.slice(0, this.config.maxRecommendations / 2)) {
      const score = this.calculateRecommendationScore(game, commonGames);
      recommendations.push({
        appId: game.appId,
        name: game.name,
        recommendationScore: score,
        reason: `${game.name}は相性の良いゲームです（プレイ時間: ${Math.round(game.playtimeForever / 60)}時間）`,
        genres: game.genres || [],
        estimatedPlaytime: game.playtimeForever
      });
    }

    // 推奨スコアでソート（降順）
    return recommendations
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, this.config.maxRecommendations);
  }

  /**
   * 推奨スコアを計算
   * @param game 推奨対象ゲーム
   * @param commonGames 共通ゲーム一覧
   * @returns 推奨スコア（0-100）
   */
  private calculateRecommendationScore(game: Game, commonGames: CommonGame[]): number {
    let score = 50; // ベーススコア

    // プレイ時間による加点
    const playtimeHours = game.playtimeForever / 60;
    score += Math.min(30, playtimeHours / 10); // 10時間で3点、最大30点

    // ジャンル一致による加点
    if (game.genres) {
      const commonGenres = new Set(commonGames.flatMap(g => g.genres || []));
      const matchingGenres = game.genres.filter(genre => commonGenres.has(genre));
      score += matchingGenres.length * 5; // ジャンル一致1つにつき5点
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 入力検証
   * @param library1 ユーザー1のライブラリ
   * @param library2 ユーザー2のライブラリ
   */
  private validateInputs(library1: GameLibrary, library2: GameLibrary): void {
    if (!library1 || !library2) {
      throw new Error('Both game libraries are required');
    }

    if (!library1.isPublic) {
      const error: CompatibilityAnalysisError = {
        type: 'PRIVATE_PROFILE',
        message: 'User 1 profile is private'
      };
      throw error;
    }

    if (!library2.isPublic) {
      const error: CompatibilityAnalysisError = {
        type: 'PRIVATE_PROFILE',
        message: 'User 2 profile is private'
      };
      throw error;
    }

    if (library1.games.length === 0 && library2.games.length === 0) {
      const error: CompatibilityAnalysisError = {
        type: 'INSUFFICIENT_DATA',
        message: 'Both users have empty game libraries'
      };
      throw error;
    }
  }
}

// デフォルトインスタンス
export const compatibilityAnalyzer = new CompatibilityAnalyzer();