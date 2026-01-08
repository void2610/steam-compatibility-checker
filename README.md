# Steam相性診断 (Steam Compatibility Checker)

Steam APIを活用してユーザー同士のゲームライブラリを比較し、共通のゲームや相性度を分析するwebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS
- **言語**: TypeScript
- **認証**: Steam OpenID 2.0
- **API**: Steam Web API
- **デプロイメント**: Vercel (静的サイト)

## 機能

- Steam認証とプロフィール取得
- ゲームライブラリの比較分析
- 相性スコアの計算
- Co-opゲーム提案機能
- レスポンシブデザイン
- 結果シェア機能

## セットアップ

### 前提条件

- Node.js 20.9.0以上
- Steam Web API Key

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd steam-compatibility-checker
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集して、Steam API Keyを設定してください：
```
NEXT_PUBLIC_STEAM_API_KEY=your_steam_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

### ビルド

```bash
npm run build
```

### 型チェック

```bash
npm run type-check
```

## プロジェクト構造

```
src/
├── app/                 # Next.js App Router
├── components/          # Reactコンポーネント
├── constants/           # 定数定義
├── hooks/              # カスタムフック
├── lib/                # ライブラリとユーティリティ
├── services/           # API サービス
├── types/              # TypeScript型定義
└── utils/              # ヘルパー関数
```

## Steam API Key の取得

1. [Steam Web API Key](https://steamcommunity.com/dev/apikey) にアクセス
2. Steam アカウントでログイン
3. ドメイン名を入力（開発時は `localhost` でも可）
4. API Key を取得して環境変数に設定

## ライセンス

MIT License
