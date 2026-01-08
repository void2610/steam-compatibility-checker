// Steam OpenID認証の実装

import { env } from './env';

// Steam OpenID設定
const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_ID_REGEX = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

// OpenID認証パラメータ
interface OpenIdParams {
  'openid.ns': string;
  'openid.mode': string;
  'openid.return_to': string;
  'openid.realm': string;
  'openid.identity': string;
  'openid.claimed_id': string;
}

// 認証レスポンス
export interface SteamAuthResponse {
  success: boolean;
  steamId?: string;
  error?: string;
}

// Steam OpenID認証URLの生成
export function generateSteamAuthUrl(returnUrl: string): string {
  const params: Record<string, string> = {
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': env.appUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  };

  const searchParams = new URLSearchParams(params);
  return `${STEAM_OPENID_URL}?${searchParams.toString()}`;
}

// OpenIDレスポンスからSteam IDを抽出
export function extractSteamId(searchParams: URLSearchParams): SteamAuthResponse {
  try {
    // OpenIDモードの確認
    const mode = searchParams.get('openid.mode');
    if (mode !== 'id_res') {
      return {
        success: false,
        error: mode === 'cancel' ? 'ユーザーによって認証がキャンセルされました' : '無効な認証レスポンスです',
      };
    }

    // Steam IDの抽出
    const identity = searchParams.get('openid.identity');
    if (!identity) {
      return {
        success: false,
        error: '認証レスポンスにidentityが含まれていません',
      };
    }

    const match = identity.match(STEAM_ID_REGEX);
    if (!match || !match[1]) {
      return {
        success: false,
        error: '無効なSteam IDフォーマットです',
      };
    }

    const steamId = match[1];
    
    // Steam IDの基本検証（17桁の数字）
    if (!/^\d{17}$/.test(steamId)) {
      return {
        success: false,
        error: '無効なSteam ID形式です',
      };
    }

    return {
      success: true,
      steamId,
    };
  } catch (error) {
    return {
      success: false,
      error: '認証レスポンスの処理中にエラーが発生しました',
    };
  }
}

// OpenIDレスポンスの検証（簡易版）
export function validateOpenIdResponse(searchParams: URLSearchParams): boolean {
  const requiredParams = [
    'openid.ns',
    'openid.mode',
    'openid.op_endpoint',
    'openid.claimed_id',
    'openid.identity',
    'openid.return_to',
    'openid.response_nonce',
    'openid.assoc_handle',
    'openid.signed',
    'openid.sig',
  ];

  // 必須パラメータの存在確認
  for (const param of requiredParams) {
    if (!searchParams.has(param)) {
      return false;
    }
  }

  // 基本的な値の検証
  const ns = searchParams.get('openid.ns');
  const opEndpoint = searchParams.get('openid.op_endpoint');
  
  return (
    ns === 'http://specs.openid.net/auth/2.0' &&
    opEndpoint === 'https://steamcommunity.com/openid/login'
  );
}

// 認証URLのリダイレクト処理
export function redirectToSteamAuth(returnUrl?: string): void {
  if (typeof window === 'undefined') {
    throw new Error('Steam認証はクライアントサイドでのみ実行できます');
  }

  const callbackUrl = returnUrl || `${env.appUrl}/auth/callback`;
  const authUrl = generateSteamAuthUrl(callbackUrl);
  
  window.location.href = authUrl;
}

// Steam IDの形式検証
export function isValidSteamId(steamId: string): boolean {
  return /^\d{17}$/.test(steamId);
}

// Steam プロフィールURLからSteam IDを抽出
export function extractSteamIdFromUrl(url: string): string | null {
  // Steam ID直接指定の場合
  const steamIdMatch = url.match(/\/profiles\/(\d{17})/);
  if (steamIdMatch) {
    return steamIdMatch[1];
  }

  // カスタムURL（vanity URL）の場合
  const vanityMatch = url.match(/\/id\/([a-zA-Z0-9_-]+)/);
  if (vanityMatch) {
    return vanityMatch[1]; // これは後でResolveVanityURL APIで解決する必要がある
  }

  // 数字のみの場合（Steam ID直接入力）
  if (/^\d{17}$/.test(url)) {
    return url;
  }

  return null;
}