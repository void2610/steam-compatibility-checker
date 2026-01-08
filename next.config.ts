import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的サイト生成の設定
  output: 'export',
  
  // 画像最適化を無効化（静的エクスポート時に必要）
  images: {
    unoptimized: true,
  },
  
  // トレイリングスラッシュを追加
  trailingSlash: true,
  
  // ベースパスの設定（必要に応じて）
  // basePath: '/steam-compatibility-checker',
  
  // 静的ファイルの設定
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // TypeScript設定
  typescript: {
    // 型チェックエラーでもビルドを続行
    ignoreBuildErrors: false,
  },
  
  // 実験的機能は現在不要（Next.js 14ではApp Routerがデフォルト）
};

export default nextConfig;
