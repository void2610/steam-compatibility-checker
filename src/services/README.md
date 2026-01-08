# Steam API統合

このディレクトリには、Steam Web APIとの統合機能が含まれています。

## 概要

Steam API統合は以下の機能を提供します：

- **Steam認証**: OpenID 2.0による認証
- **ゲームライブラリ取得**: ユーザーの所有ゲーム一覧の取得
- **プレイヤー情報取得**: プロフィール情報の取得
- **バニティURL解決**: カスタムURLからSteam IDへの変換
- **エラーハンドリング**: 包括的なエラー処理と再試行機能
- **キャッシュ機能**: セッション中のAPIレスポンスキャッシュ

## ファイル構成

```
src/services/
├── steam-api.ts              # メインのSteam APIサービスクラス
└── README.md                 # このファイル

src/lib/
├── steam-api-errors.ts       # エラーハンドリングとエラーコード定義
└── cache-manager.ts          # キャッシュ管理システム

src/examples/
└── steam-api-usage.ts        # 使用例とサンプルコード
```

## 基本的な使用方法

### 1. サービスの初期化

```typescript
import { steamApiService } from '@/services/steam-api';

// デフォルトインスタンスを使用
const service = steamApiService;

// または、カスタム設定でインスタンスを作成
import { SteamApiService } from '@/services/steam-api';
const customService = new SteamApiService('your-api-key');
```

### 2. Steam IDの解決

```typescript
// 既存のSteam ID
const steamId = await service.resolveSteamId('76561198000000000');

// プロフィールURL
const steamId = await service.resolveSteamId('https://steamcommunity.com/profiles/76561198000000000/');

// カスタムURL
const steamId = await service.resolveSteamId('https://steamcommunity.com/id/username');
```

### 3. プレイヤー情報の取得

```typescript
const players = await service.getPlayerSummaries(['76561198000000000']);
console.log(players[0].personaName); // プレイヤー名
console.log(players[0].avatarUrl);   // アバター画像URL
```

### 4. ゲームライブラリの取得

```typescript
const library = await service.getOwnedGames('76561198000000000');
console.log(`所有ゲーム数: ${library.totalCount}`);
console.log(`プロフィール公開: ${library.isPublic}`);

// ゲーム一覧の表示
library.games.forEach(game => {
  console.log(`${game.name}: ${game.playtimeForever}分`);
});
```

## エラーハンドリング

```typescript
import { SteamApiError, STEAM_API_ERROR_CODES } from '@/lib/steam-api-errors';

try {
  const result = await service.getOwnedGames(steamId);
} catch (error) {
  if (error instanceof SteamApiError) {
    switch (error.code) {
      case STEAM_API_ERROR_CODES.MISSING_API_KEY:
        console.log('APIキーが設定されていません');
        break;
      case STEAM_API_ERROR_CODES.PRIVATE_PROFILE:
        console.log('プロフィールが非公開です');
        break;
      case STEAM_API_ERROR_CODES.RATE_LIMITED:
        console.log('レート制限に達しました');
        break;
      default:
        console.log('その他のエラー:', error.message);
    }
  }
}
```

## キャッシュ機能

### キャッシュ統計の確認

```typescript
const stats = service.getCacheStats();
console.log(`ヒット率: ${stats.hitRate * 100}%`);
console.log(`キャッシュエントリ数: ${stats.totalEntries}`);
```

### キャッシュの管理

```typescript
// キャッシュをクリア
service.clearCache();

// 特定のSteam IDに関連するキャッシュを無効化
service.invalidateCacheForSteamId('76561198000000000');

// 期限切れキャッシュの削除
service.cleanupExpiredCache();
```

## 設定

### 環境変数

```bash
# Steam Web API Key（必須）
NEXT_PUBLIC_STEAM_API_KEY=your_steam_api_key_here

# アプリケーションURL（認証用）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API制限

- **GetPlayerSummaries**: 最大100個のSteam IDを同時に処理
- **レート制限**: Steam APIの制限に従い、自動的に再試行
- **タイムアウト**: デフォルト10秒（設定可能）

## エラーコード一覧

| コード | 説明 | 再試行可能 |
|--------|------|-----------|
| `MISSING_API_KEY` | APIキーが設定されていない | ❌ |
| `INVALID_API_KEY` | APIキーが無効 | ❌ |
| `RATE_LIMITED` | レート制限に達した | ✅ |
| `TIMEOUT` | リクエストタイムアウト | ✅ |
| `NETWORK_ERROR` | ネットワークエラー | ✅ |
| `INVALID_STEAM_ID` | 無効なSteam ID | ❌ |
| `VANITY_URL_NOT_FOUND` | バニティURLが見つからない | ❌ |
| `PRIVATE_PROFILE` | プロフィールが非公開 | ❌ |
| `SERVER_ERROR` | サーバーエラー | ✅ |
| `SERVICE_UNAVAILABLE` | サービス利用不可 | ✅ |

## キャッシュ設定

### デフォルト設定

- **ゲームライブラリ**: 10分間キャッシュ
- **プレイヤー情報**: 5分間キャッシュ
- **バニティURL解決**: 1時間キャッシュ
- **Steam ID解決**: 30分間キャッシュ

### カスタム設定

```typescript
import { SteamApiCacheManager } from '@/lib/cache-manager';

const customCache = new SteamApiCacheManager();
const service = new SteamApiService('api-key', undefined, customCache);
```

## 開発とテスト

### 使用例の実行

```typescript
import { runAllExamples } from '@/examples/steam-api-usage';

// 開発環境で使用例を実行
await runAllExamples();
```

### デバッグ

開発環境では、エラーログがコンソールに出力されます：

```typescript
// 開発環境でのエラーログ出力を有効化
process.env.NODE_ENV = 'development';
```

## 注意事項

1. **APIキーの管理**: Steam Web API Keyは機密情報です。環境変数で管理してください。
2. **レート制限**: Steam APIには制限があります。過度なリクエストは避けてください。
3. **プライバシー**: 非公開プロフィールのユーザーは適切に処理してください。
4. **エラーハンドリング**: すべてのAPI呼び出しでエラーハンドリングを実装してください。

## 参考リンク

- [Steam Web API Documentation](https://steamcommunity.com/dev)
- [Steam Web API Key取得](https://steamcommunity.com/dev/apikey)
- [Steam OpenID仕様](https://steamcommunity.com/dev/openid)