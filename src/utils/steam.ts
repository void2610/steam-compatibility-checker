// Steam関連のユーティリティ関数

/**
 * Steam IDの形式を検証する
 */
export function isValidSteamId(steamId: string): boolean {
  // Steam ID64の形式をチェック（17桁の数字）
  const steamId64Regex = /^[0-9]{17}$/;
  return steamId64Regex.test(steamId);
}

/**
 * Steam プロフィールURLからSteam IDを抽出する
 */
export function extractSteamIdFromUrl(url: string): string | null {
  // Steam ID64が含まれるURL
  const steamId64Match = url.match(/\/profiles\/([0-9]{17})/);
  if (steamId64Match) {
    return steamId64Match[1];
  }
  
  // カスタムURLの場合はnullを返す（別途API呼び出しが必要）
  const customUrlMatch = url.match(/\/id\/([a-zA-Z0-9_-]+)/);
  if (customUrlMatch) {
    return null; // カスタムURLの場合は解決が必要
  }
  
  return null;
}

/**
 * Steam プロフィールURLからカスタムURLを抽出する
 */
export function extractCustomUrlFromSteamUrl(url: string): string | null {
  const customUrlMatch = url.match(/\/id\/([a-zA-Z0-9_-]+)/);
  return customUrlMatch ? customUrlMatch[1] : null;
}

/**
 * Steam アプリのアイコンURLを生成する
 */
export function getSteamAppIconUrl(appId: number, iconHash?: string): string {
  if (!iconHash) {
    return '/images/default-game-icon.png'; // デフォルトアイコン
  }
  
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}

/**
 * Steam ストアページのURLを生成する
 */
export function getSteamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}/`;
}

/**
 * プレイ時間を人間が読みやすい形式に変換する
 */
export function formatPlaytime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0 ? `${days}日${remainingHours}時間` : `${days}日`;
}

/**
 * Steam OpenID認証URLを生成する
 */
export function generateSteamOpenIdUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': new URL(returnUrl).origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}