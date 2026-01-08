// 環境変数の型安全な管理

// 環境変数の型定義
interface EnvironmentVariables {
  NEXT_PUBLIC_STEAM_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// 環境変数の検証と取得
function getEnvVar(key: keyof EnvironmentVariables): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value;
}

// 環境変数の安全な取得（オプショナル）
function getOptionalEnvVar(key: keyof EnvironmentVariables): string | undefined {
  return process.env[key];
}

// 環境設定オブジェクト
export const env = {
  // Steam API Key（必須）
  steamApiKey: getOptionalEnvVar('NEXT_PUBLIC_STEAM_API_KEY') || '',
  
  // アプリケーションURL（必須）
  appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000',
  
  // 実行環境
  nodeEnv: (process.env.NODE_ENV as EnvironmentVariables['NODE_ENV']) || 'development',
  
  // 開発環境かどうか
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // 本番環境かどうか
  isProduction: process.env.NODE_ENV === 'production',
  
  // テスト環境かどうか
  isTest: process.env.NODE_ENV === 'test',
} as const;

// 環境変数の検証
export function validateEnvironment(): void {
  const requiredVars: (keyof EnvironmentVariables)[] = [];
  
  // 本番環境では必須の環境変数をチェック
  if (env.isProduction) {
    requiredVars.push('NEXT_PUBLIC_STEAM_API_KEY', 'NEXT_PUBLIC_APP_URL');
  }
  
  const missingVars = requiredVars.filter(key => !process.env[key]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

// 開発環境での警告表示
if (env.isDevelopment) {
  if (!env.steamApiKey) {
    console.warn('⚠️  NEXT_PUBLIC_STEAM_API_KEY is not set. Steam API calls will fail.');
  }
}