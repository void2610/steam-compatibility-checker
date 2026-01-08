'use client';

import { useState, useMemo } from 'react';
import { GameLibrary, Game, SteamUser } from '@/types/steam';
import { LoadingState } from '@/types/ui';

// ゲームライブラリ表示コンポーネント
interface GameLibraryDisplayProps {
  library: GameLibrary | null;
  user?: SteamUser;
  loading?: LoadingState;
  error?: string | null;
  className?: string;
  showSearch?: boolean;
  showStats?: boolean;
  maxGamesDisplay?: number;
}

export function GameLibraryDisplay({
  library,
  user,
  loading,
  error,
  className = '',
  showSearch = true,
  showStats = true,
  maxGamesDisplay = 50
}: GameLibraryDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'playtime'>('playtime');
  const [showAll, setShowAll] = useState(false);

  // ゲームのフィルタリングとソート
  const filteredAndSortedGames = useMemo(() => {
    if (!library?.games) return [];

    let filtered = library.games.filter(game =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'playtime') {
        return b.playtimeForever - a.playtimeForever;
      }
      return a.name.localeCompare(b.name, 'ja');
    });

    return showAll ? filtered : filtered.slice(0, maxGamesDisplay);
  }, [library?.games, searchTerm, sortBy, showAll, maxGamesDisplay]);

  // 統計情報の計算
  const stats = useMemo(() => {
    if (!library?.games) return null;

    const totalPlaytime = library.games.reduce((sum, game) => sum + game.playtimeForever, 0);
    const playedGames = library.games.filter(game => game.playtimeForever > 0);
    const recentGames = library.games.filter(game => game.playtime2Weeks && game.playtime2Weeks > 0);

    return {
      totalGames: library.totalCount,
      playedGames: playedGames.length,
      totalPlaytime,
      recentGames: recentGames.length,
      averagePlaytime: playedGames.length > 0 ? Math.round(totalPlaytime / playedGames.length) : 0
    };
  }, [library]);

  const formatPlaytime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}日 ${remainingHours}時間` : `${days}日`;
  };

  // ローディング状態
  if (loading?.isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {loading.message && (
          <div className="mt-4 text-center text-sm text-gray-600">
            {loading.message}
          </div>
        )}
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ライブラリ取得エラー</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ライブラリが非公開の場合
  if (library && !library.isPublic) {
    return (
      <div className={`bg-yellow-50 rounded-lg border border-yellow-200 p-6 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">プロフィールが非公開です</h3>
            <p className="text-sm text-yellow-700 mb-4">
              このユーザーのゲームライブラリは非公開に設定されているため、相性分析を行うことができません。
            </p>
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-1">解決方法:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Steamプロフィール設定でゲーム詳細を「公開」に変更する</li>
                <li>プライバシー設定で「所有ゲーム」を公開する</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ライブラリが空の場合
  if (!library || library.games.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ゲームライブラリが空です</h3>
          <p className="text-sm text-gray-500">
            {user ? `${user.personaName}さんの` : 'この'}ゲームライブラリにはゲームが登録されていません。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {user ? `${user.personaName}のゲームライブラリ` : 'ゲームライブラリ'}
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'playtime')}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="playtime">プレイ時間順</option>
              <option value="name">名前順</option>
            </select>
          </div>
        </div>

        {/* 統計情報 */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalGames.toLocaleString()}</div>
              <div className="text-xs text-gray-500">総ゲーム数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.playedGames.toLocaleString()}</div>
              <div className="text-xs text-gray-500">プレイ済み</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatPlaytime(stats.totalPlaytime)}</div>
              <div className="text-xs text-gray-500">総プレイ時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.recentGames}</div>
              <div className="text-xs text-gray-500">最近プレイ</div>
            </div>
          </div>
        )}

        {/* 検索バー */}
        {showSearch && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ゲームを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        )}
      </div>

      {/* ゲーム一覧 */}
      <div className="p-6">
        {filteredAndSortedGames.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">検索条件に一致するゲームが見つかりません。</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredAndSortedGames.map((game) => (
                <GameItem key={game.appId} game={game} />
              ))}
            </div>

            {/* もっと見るボタン */}
            {!showAll && library.games.length > maxGamesDisplay && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  さらに {library.games.length - maxGamesDisplay} ゲームを表示
                </button>
              </div>
            )}

            {showAll && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAll(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  表示を折りたたむ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 個別ゲームアイテムコンポーネント
interface GameItemProps {
  game: Game;
  showPlaytime?: boolean;
  compact?: boolean;
}

export function GameItem({ game, showPlaytime = true, compact = false }: GameItemProps) {
  const formatPlaytime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}日 ${remainingHours}時間` : `${days}日`;
  };

  const getGameIconUrl = (appId: number, iconHash?: string): string => {
    if (!iconHash) {
      return `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;
    }
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
  };

  const handleGameClick = () => {
    window.open(`https://store.steampowered.com/app/${game.appId}`, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={handleGameClick}>
        <img
          src={getGameIconUrl(game.appId, game.imgIconUrl)}
          alt={game.name}
          className="w-6 h-6 rounded object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/24x24/e5e7eb/9ca3af?text=${game.name.charAt(0)}`;
          }}
        />
        <span className="text-sm text-gray-700 truncate flex-1">{game.name}</span>
        {showPlaytime && game.playtimeForever > 0 && (
          <span className="text-xs text-gray-500">{formatPlaytime(game.playtimeForever)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={handleGameClick}>
      <div className="flex-shrink-0">
        <img
          src={getGameIconUrl(game.appId, game.imgIconUrl)}
          alt={game.name}
          className="w-10 h-10 rounded object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/40x40/e5e7eb/9ca3af?text=${game.name.charAt(0)}`;
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{game.name}</h4>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {showPlaytime && (
            <>
              <span>総プレイ時間: {formatPlaytime(game.playtimeForever)}</span>
              {game.playtime2Weeks && game.playtime2Weeks > 0 && (
                <span>最近2週間: {formatPlaytime(game.playtime2Weeks)}</span>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  );
}

// ライブラリ比較表示コンポーネント
interface LibraryComparisonProps {
  library1: GameLibrary;
  library2: GameLibrary;
  user1?: SteamUser;
  user2?: SteamUser;
  className?: string;
}

export function LibraryComparison({ 
  library1, 
  library2, 
  user1, 
  user2, 
  className = '' 
}: LibraryComparisonProps) {
  const commonGames = useMemo(() => {
    const library1AppIds = new Set(library1.games.map(g => g.appId));
    return library2.games.filter(game => library1AppIds.has(game.appId));
  }, [library1.games, library2.games]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ライブラリ比較</h3>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{library1.totalCount}</div>
            <div className="text-sm text-gray-500">{user1?.personaName || 'ユーザー1'}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{commonGames.length}</div>
            <div className="text-sm text-gray-500">共通ゲーム</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{library2.totalCount}</div>
            <div className="text-sm text-gray-500">{user2?.personaName || 'ユーザー2'}</div>
          </div>
        </div>
      </div>

      {commonGames.length > 0 && (
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">共通ゲーム ({commonGames.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commonGames.slice(0, 10).map((game) => (
              <GameItem key={game.appId} game={game} compact />
            ))}
            {commonGames.length > 10 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">他 {commonGames.length - 10} ゲーム</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}