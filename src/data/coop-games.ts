import { CoopGameDatabase, CoopGameInfo } from '@/types/coop';

/**
 * 人気co-opゲームの静的データベース
 * Steam App IDをキーとしてco-op情報を格納
 */
export const coopGamesDatabase: CoopGameDatabase = {
  // Portal 2
  620: {
    appId: 620,
    name: 'Portal 2',
    coopType: 'online',
    maxPlayers: 2,
    description: 'パズル協力ゲーム。2人でポータルを使って謎解きに挑戦',
    steamUrl: 'https://store.steampowered.com/app/620/Portal_2/',
    genres: ['Puzzle', 'Co-op', 'First-Person'],
    isPopular: true
  },

  // Left 4 Dead 2
  550: {
    appId: 550,
    name: 'Left 4 Dead 2',
    coopType: 'online',
    maxPlayers: 4,
    description: 'ゾンビサバイバル協力シューター。4人でゾンビの群れを突破',
    steamUrl: 'https://store.steampowered.com/app/550/Left_4_Dead_2/',
    genres: ['Action', 'Co-op', 'Zombies', 'FPS'],
    isPopular: true
  },

  // Terraria
  105600: {
    appId: 105600,
    name: 'Terraria',
    coopType: 'online',
    maxPlayers: 8,
    description: '2Dサンドボックス冒険ゲーム。建築、探索、ボス戦を協力プレイ',
    steamUrl: 'https://store.steampowered.com/app/105600/Terraria/',
    genres: ['Sandbox', 'Adventure', 'Co-op', '2D'],
    isPopular: true
  },

  // Stardew Valley
  413150: {
    appId: 413150,
    name: 'Stardew Valley',
    coopType: 'online',
    maxPlayers: 4,
    description: '農場経営シミュレーション。友達と一緒に農場を発展させよう',
    steamUrl: 'https://store.steampowered.com/app/413150/Stardew_Valley/',
    genres: ['Simulation', 'Farming', 'Co-op', 'Relaxing'],
    isPopular: true
  },

  // Don't Starve Together
  322330: {
    appId: 322330,
    name: "Don't Starve Together",
    coopType: 'online',
    maxPlayers: 6,
    description: 'サバイバル協力ゲーム。厳しい世界で生き残るために協力',
    steamUrl: 'https://store.steampowered.com/app/322330/Dont_Starve_Together/',
    genres: ['Survival', 'Co-op', 'Indie', 'Adventure'],
    isPopular: true
  },

  // Overcooked! 2
  728880: {
    appId: 728880,
    name: 'Overcooked! 2',
    coopType: 'both',
    maxPlayers: 4,
    description: 'カオスな料理協力ゲーム。チームワークで料理を完成させよう',
    steamUrl: 'https://store.steampowered.com/app/728880/Overcooked_2/',
    genres: ['Co-op', 'Party Game', 'Local Co-Op', 'Cooking'],
    isPopular: true
  },

  // A Way Out
  1222700: {
    appId: 1222700,
    name: 'A Way Out',
    coopType: 'online',
    maxPlayers: 2,
    description: '脱獄協力アドベンチャー。2人専用の映画的体験',
    steamUrl: 'https://store.steampowered.com/app/1222700/A_Way_Out/',
    genres: ['Adventure', 'Co-op', 'Story Rich', 'Action'],
    isPopular: true
  },

  // Deep Rock Galactic
  548430: {
    appId: 548430,
    name: 'Deep Rock Galactic',
    coopType: 'online',
    maxPlayers: 4,
    description: 'ドワーフ宇宙採掘協力FPS。チームで洞窟を探索し資源を採掘',
    steamUrl: 'https://store.steampowered.com/app/548430/Deep_Rock_Galactic/',
    genres: ['FPS', 'Co-op', 'Mining', 'Dwarfs'],
    isPopular: true
  },

  // It Takes Two
  1426210: {
    appId: 1426210,
    name: 'It Takes Two',
    coopType: 'both',
    maxPlayers: 2,
    description: '2人専用協力アドベンチャー。様々なミニゲームで絆を深める',
    steamUrl: 'https://store.steampowered.com/app/1426210/It_Takes_Two/',
    genres: ['Adventure', 'Co-op', 'Platformer', 'Story Rich'],
    isPopular: true
  },

  // Valheim
  892970: {
    appId: 892970,
    name: 'Valheim',
    coopType: 'online',
    maxPlayers: 10,
    description: 'バイキングサバイバル。北欧神話の世界で協力建築とボス戦',
    steamUrl: 'https://store.steampowered.com/app/892970/Valheim/',
    genres: ['Survival', 'Co-op', 'Building', 'Vikings'],
    isPopular: true
  },

  // Among Us
  945360: {
    appId: 945360,
    name: 'Among Us',
    coopType: 'online',
    maxPlayers: 15,
    description: '宇宙船での人狼ゲーム。協力と裏切りの心理戦',
    steamUrl: 'https://store.steampowered.com/app/945360/Among_Us/',
    genres: ['Party Game', 'Multiplayer', 'Social Deduction', 'Space'],
    isPopular: true
  },

  // Phasmophobia
  739630: {
    appId: 739630,
    name: 'Phasmophobia',
    coopType: 'online',
    maxPlayers: 4,
    description: '協力ホラーゲーム。チームでゴーストハンティング',
    steamUrl: 'https://store.steampowered.com/app/739630/Phasmophobia/',
    genres: ['Horror', 'Co-op', 'Ghosts', 'Investigation'],
    isPopular: true
  },

  // Risk of Rain 2
  632360: {
    appId: 632360,
    name: 'Risk of Rain 2',
    coopType: 'online',
    maxPlayers: 4,
    description: '3Dローグライク協力シューター。チームで惑星を脱出',
    steamUrl: 'https://store.steampowered.com/app/632360/Risk_of_Rain_2/',
    genres: ['Roguelike', 'Co-op', 'Third-Person Shooter', '3D'],
    isPopular: true
  },

  // Cuphead
  268910: {
    appId: 268910,
    name: 'Cuphead',
    coopType: 'local',
    maxPlayers: 2,
    description: 'ローカル協力アクション。手描きアニメーションの高難度ゲーム',
    steamUrl: 'https://store.steampowered.com/app/268910/Cuphead/',
    genres: ['Action', 'Local Co-Op', 'Platformer', 'Difficult'],
    isPopular: true
  },

  // Moving Out
  996770: {
    appId: 996770,
    name: 'Moving Out',
    coopType: 'both',
    maxPlayers: 4,
    description: '引っ越し協力ゲーム。チームワークで家具を運び出そう',
    steamUrl: 'https://store.steampowered.com/app/996770/Moving_Out/',
    genres: ['Co-op', 'Party Game', 'Physics', 'Local Co-Op'],
    isPopular: true
  },

  // Human Fall Flat
  477160: {
    appId: 477160,
    name: 'Human Fall Flat',
    coopType: 'both',
    maxPlayers: 8,
    description: '物理パズル協力ゲーム。ふにゃふにゃキャラで謎解き',
    steamUrl: 'https://store.steampowered.com/app/477160/Human_Fall_Flat/',
    genres: ['Puzzle', 'Co-op', 'Physics', 'Platformer'],
    isPopular: true
  },

  // Raft
  648800: {
    appId: 648800,
    name: 'Raft',
    coopType: 'online',
    maxPlayers: 10,
    description: '海洋サバイバル。いかだを拡張しながら海を漂流',
    steamUrl: 'https://store.steampowered.com/app/648800/Raft/',
    genres: ['Survival', 'Co-op', 'Building', 'Ocean'],
    isPopular: true
  },

  // Fall Guys
  1097150: {
    appId: 1097150,
    name: 'Fall Guys',
    coopType: 'online',
    maxPlayers: 60,
    description: 'バトルロイヤルパーティーゲーム。可愛いキャラで競争',
    steamUrl: 'https://store.steampowered.com/app/1097150/Fall_Guys/',
    genres: ['Party Game', 'Battle Royale', 'Multiplayer', 'Colorful'],
    isPopular: true
  },

  // Rocket League
  252950: {
    appId: 252950,
    name: 'Rocket League',
    coopType: 'online',
    maxPlayers: 8,
    description: '車でサッカー。チームでゴールを目指すスポーツゲーム',
    steamUrl: 'https://store.steampowered.com/app/252950/Rocket_League/',
    genres: ['Sports', 'Racing', 'Multiplayer', 'Soccer'],
    isPopular: true
  },

  // Borderlands 3
  397540: {
    appId: 397540,
    name: 'Borderlands 3',
    coopType: 'online',
    maxPlayers: 4,
    description: 'ルートシューター協力FPS。武器収集とボス戦を楽しもう',
    steamUrl: 'https://store.steampowered.com/app/397540/Borderlands_3/',
    genres: ['FPS', 'Co-op', 'Loot', 'Action RPG'],
    isPopular: true
  },

  // Destiny 2
  1085660: {
    appId: 1085660,
    name: 'Destiny 2',
    coopType: 'online',
    maxPlayers: 6,
    description: 'オンラインFPS RPG。チームでレイドやストライクに挑戦',
    steamUrl: 'https://store.steampowered.com/app/1085660/Destiny_2/',
    genres: ['FPS', 'MMO', 'Co-op', 'Sci-fi'],
    isPopular: true
  },

  // Monster Hunter: World
  582010: {
    appId: 582010,
    name: 'Monster Hunter: World',
    coopType: 'online',
    maxPlayers: 4,
    description: 'モンスターハンティング協力アクション。巨大モンスターを狩ろう',
    steamUrl: 'https://store.steampowered.com/app/582010/Monster_Hunter_World/',
    genres: ['Action', 'Co-op', 'Hunting', 'RPG'],
    isPopular: true
  },

  // Payday 2
  218620: {
    appId: 218620,
    name: 'PAYDAY 2',
    coopType: 'online',
    maxPlayers: 4,
    description: '協力強盗FPS。チームで銀行強盗や潜入ミッション',
    steamUrl: 'https://store.steampowered.com/app/218620/PAYDAY_2/',
    genres: ['FPS', 'Co-op', 'Heist', 'Crime'],
    isPopular: true
  },

  // Dying Light
  239140: {
    appId: 239140,
    name: 'Dying Light',
    coopType: 'online',
    maxPlayers: 4,
    description: 'ゾンビサバイバル協力アクション。昼夜のサイクルで戦略が変化',
    steamUrl: 'https://store.steampowered.com/app/239140/Dying_Light/',
    genres: ['Survival', 'Co-op', 'Zombies', 'Parkour'],
    isPopular: true
  },

  // The Forest
  242760: {
    appId: 242760,
    name: 'The Forest',
    coopType: 'online',
    maxPlayers: 8,
    description: 'サバイバルホラー協力ゲーム。森で生き残り息子を探そう',
    steamUrl: 'https://store.steampowered.com/app/242760/The_Forest/',
    genres: ['Survival', 'Co-op', 'Horror', 'Building'],
    isPopular: true
  }
};

/**
 * co-opゲーム情報を取得
 * @param appId Steam App ID
 * @returns co-opゲーム情報（存在しない場合はundefined）
 */
export function getCoopGameInfo(appId: number): CoopGameInfo | undefined {
  return coopGamesDatabase[appId];
}

/**
 * 全co-opゲーム一覧を取得
 * @returns co-opゲーム情報配列
 */
export function getAllCoopGames(): CoopGameInfo[] {
  return Object.values(coopGamesDatabase);
}

/**
 * 人気co-opゲーム一覧を取得
 * @returns 人気co-opゲーム情報配列
 */
export function getPopularCoopGames(): CoopGameInfo[] {
  return Object.values(coopGamesDatabase).filter(game => game.isPopular);
}

/**
 * ジャンル別co-opゲーム検索
 * @param genres 検索対象ジャンル配列
 * @returns マッチするco-opゲーム情報配列
 */
export function searchCoopGamesByGenres(genres: string[]): CoopGameInfo[] {
  return Object.values(coopGamesDatabase).filter(game =>
    genres.some(genre => game.genres.includes(genre))
  );
}

/**
 * co-opタイプ別ゲーム検索
 * @param coopType co-opタイプ
 * @returns マッチするco-opゲーム情報配列
 */
export function getCoopGamesByType(coopType: 'local' | 'online' | 'both'): CoopGameInfo[] {
  return Object.values(coopGamesDatabase).filter(game => 
    game.coopType === coopType || game.coopType === 'both'
  );
}