/**
 * Steam API Service 使用例
 * 実装されたSteam API統合機能の使用方法を示すサンプルコード
 */

import { steamApiService, SteamApiError } from '../services/steam-api';
import { STEAM_API_ERROR_CODES, ErrorReporter } from '../lib/steam-api-errors';

/**
 * Steam APIサービスの基本的な使用例
 */
export async function basicUsageExample() {
  try {
    console.log('=== Steam API Service 使用例 ===');

    // 1. Steam IDの解決
    console.log('\n1. Steam IDの解決:');
    const steamId = await steamApiService.resolveSteamId('76561198000000000');
    console.log(`解決されたSteam ID: ${steamId}`);

    // 2. プレイヤー情報の取得
    console.log('\n2. プレイヤー情報の取得:');
    const players = await steamApiService.getPlayerSummaries([steamId]);
    console.log(`プレイヤー名: ${players[0]?.personaName}`);
    console.log(`プロフィールURL: ${players[0]?.profileUrl}`);

    // 3. ゲームライブラリの取得
    console.log('\n3. ゲームライブラリの取得:');
    const gameLibrary = await steamApiService.getOwnedGames(steamId);
    console.log(`所有ゲーム数: ${gameLibrary.totalCount}`);
    console.log(`プロフィール公開状態: ${gameLibrary.isPublic ? '公開' : '非公開'}`);

    if (gameLibrary.games.length > 0) {
      console.log('最初の5つのゲーム:');
      gameLibrary.games.slice(0, 5).forEach(game => {
        console.log(`- ${game.name} (${game.playtimeForever}分プレイ)`);
      });
    }

    // 4. キャッシュ統計の確認
    console.log('\n4. キャッシュ統計:');
    const cacheStats = steamApiService.getCacheStats();
    console.log(`キャッシュエントリ数: ${cacheStats.totalEntries}`);
    console.log(`ヒット率: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
    console.log(`ミス率: ${(cacheStats.missRate * 100).toFixed(1)}%`);

  } catch (error) {
    handleSteamApiError(error);
  }
}

/**
 * バニティURL解決の例
 */
export async function vanityUrlExample() {
  try {
    console.log('\n=== バニティURL解決の例 ===');

    // カスタムURLからSteam IDを解決
    const customUrl = 'https://steamcommunity.com/id/example_user';
    const resolvedSteamId = await steamApiService.resolveSteamId(customUrl);
    console.log(`解決されたSteam ID: ${resolvedSteamId}`);

  } catch (error) {
    handleSteamApiError(error);
  }
}

/**
 * エラーハンドリングの例
 */
export async function errorHandlingExample() {
  console.log('\n=== エラーハンドリングの例 ===');

  // 1. 無効なSteam IDのテスト
  try {
    await steamApiService.resolveSteamId('invalid_steam_id');
  } catch (error) {
    console.log('無効なSteam IDエラー:', (error as SteamApiError).message);
  }

  // 2. 存在しないバニティURLのテスト
  try {
    await steamApiService.resolveVanityUrl('nonexistent_user_12345');
  } catch (error) {
    console.log('存在しないバニティURLエラー:', (error as SteamApiError).message);
  }

  // 3. APIキーなしのテスト
  try {
    const serviceWithoutKey = new (await import('../services/steam-api')).SteamApiService('');
    await serviceWithoutKey.getOwnedGames('76561198000000000');
  } catch (error) {
    console.log('APIキーなしエラー:', (error as SteamApiError).message);
  }
}

/**
 * キャッシュ機能の例
 */
export async function cacheExample() {
  try {
    console.log('\n=== キャッシュ機能の例 ===');

    const steamId = '76561198000000000';

    // 初回リクエスト（キャッシュミス）
    console.log('初回リクエスト（キャッシュミス）:');
    const start1 = Date.now();
    await steamApiService.getPlayerSummaries([steamId]);
    const time1 = Date.now() - start1;
    console.log(`実行時間: ${time1}ms`);

    // 2回目リクエスト（キャッシュヒット）
    console.log('2回目リクエスト（キャッシュヒット）:');
    const start2 = Date.now();
    await steamApiService.getPlayerSummaries([steamId]);
    const time2 = Date.now() - start2;
    console.log(`実行時間: ${time2}ms`);

    console.log(`キャッシュによる高速化: ${time1 - time2}ms短縮`);

    // キャッシュ統計
    const stats = steamApiService.getCacheStats();
    console.log(`ヒット率: ${(stats.hitRate * 100).toFixed(1)}%`);

  } catch (error) {
    handleSteamApiError(error);
  }
}

/**
 * Steam APIエラーの統一的な処理
 */
function handleSteamApiError(error: unknown) {
  if (error instanceof SteamApiError) {
    console.error(`Steam APIエラー [${error.code}]: ${error.message}`);
    
    // エラーログの記録
    ErrorReporter.logError(error);
    
    // エラーコード別の処理
    switch (error.code) {
      case STEAM_API_ERROR_CODES.MISSING_API_KEY:
        console.log('対処法: Steam Web API Keyを設定してください');
        break;
      case STEAM_API_ERROR_CODES.RATE_LIMITED:
        console.log('対処法: しばらく待ってから再試行してください');
        break;
      case STEAM_API_ERROR_CODES.PRIVATE_PROFILE:
        console.log('対処法: Steamプロフィールを公開に設定してください');
        break;
      case STEAM_API_ERROR_CODES.INVALID_STEAM_ID:
        console.log('対処法: 正しいSteam IDまたはプロフィールURLを入力してください');
        break;
      default:
        console.log('対処法: しばらく待ってから再試行してください');
    }
  } else {
    console.error('予期しないエラー:', error);
  }
}

/**
 * すべての例を実行
 */
export async function runAllExamples() {
  console.log('Steam API Service 統合テスト開始\n');

  await basicUsageExample();
  await vanityUrlExample();
  await errorHandlingExample();
  await cacheExample();

  console.log('\n統合テスト完了');
}

// 開発環境でのみ実行
if (process.env.NODE_ENV === 'development') {
  // runAllExamples().catch(console.error);
}