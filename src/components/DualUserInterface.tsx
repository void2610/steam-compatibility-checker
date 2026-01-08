'use client';

import { ReactNode } from 'react';
import { SteamUser, GameLibrary } from '@/types/steam';
import { CompatibilityResult } from '@/types/compatibility';
import { CoopGameSuggestion } from '@/types/coop';
import { useScreenSize, ResponsiveGrid, MobileStack, ConditionalRender } from './ResponsiveLayout';

// 左右対称レイアウトの位置
export type UserPosition = 'left' | 'right';

// Co-opゲーム提案表示コンポーネントのProps
interface CoopSuggestionsProps {
  suggestions: CoopGameSuggestion[];
  maxDisplay?: number;
  showDetails?: boolean;
  className?: string;
}

// Co-opゲーム提案表示コンポーネント
export function CoopSuggestions({ 
  suggestions, 
  maxDisplay = 5, 
  showDetails = true,
  className = '' 
}: CoopSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <div className={`bg-purple-50 rounded-lg p-6 text-center border border-purple-200 ${className}`}>
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-purple-900 mb-2">Co-opゲームが見つかりませんでした</h4>
        <p className="text-sm text-purple-700">
          共通のco-op対応ゲームがありません。新しいco-opゲームを一緒に探してみましょう！
        </p>
      </div>
    );
  }

  const getCoopTypeIcon = (coopType: string) => {
    switch (coopType) {
      case 'local':
        return '🏠';
      case 'online':
        return '🌐';
      case 'both':
        return '🏠🌐';
      default:
        return '🎮';
    }
  };

  const getCoopTypeLabel = (coopType: string) => {
    switch (coopType) {
      case 'local':
        return 'ローカル';
      case 'online':
        return 'オンライン';
      case 'both':
        return 'ローカル/オンライン';
      default:
        return 'Co-op';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const displayedSuggestions = suggestions.slice(0, maxDisplay);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Co-opゲーム提案
        </h4>
        {suggestions.length > maxDisplay && (
          <span className="text-sm text-gray-500">
            {maxDisplay}件 / {suggestions.length}件表示
          </span>
        )}
      </div>

      <div className="space-y-4">
        {displayedSuggestions.map((suggestion, index) => (
          <div key={suggestion.appId} className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow">
            {/* ヘッダー */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <span className="bg-purple-600 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-gray-900 truncate mb-1">
                    {suggestion.name}
                  </h5>
                  {showDetails && suggestion.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${getScoreColor(suggestion.compatibilityScore)}`}>
                  {suggestion.compatibilityScore}%
                </span>
                {suggestion.bothOwnGame && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    両方所有
                  </span>
                )}
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getCoopTypeIcon(suggestion.coopType)}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {getCoopTypeLabel(suggestion.coopType)}
                  </div>
                  <div className="text-xs text-gray-500">プレイ方式</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">👥</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    最大{suggestion.maxPlayers}人
                  </div>
                  <div className="text-xs text-gray-500">プレイヤー数</div>
                </div>
              </div>
            </div>

            {/* 推奨理由 */}
            {showDetails && suggestion.recommendationReason && (
              <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-purple-700 font-medium mb-1">推奨理由</div>
                <div className="text-sm text-purple-800">
                  {suggestion.recommendationReason}
                </div>
              </div>
            )}

            {/* アクション */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>App ID: {suggestion.appId}</span>
              </div>
              <a
                href={suggestion.steamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Steamで見る
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 統計サマリー */}
      {suggestions.length > 0 && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h5 className="text-sm font-medium text-purple-900 mb-3">Co-op統計</h5>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-purple-600">
                {suggestions.filter(s => s.bothOwnGame).length}
              </div>
              <div className="text-xs text-purple-700">両方所有</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {suggestions.filter(s => s.coopType === 'online' || s.coopType === 'both').length}
              </div>
              <div className="text-xs text-purple-700">オンライン対応</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {Math.round(suggestions.reduce((sum, s) => sum + s.compatibilityScore, 0) / suggestions.length)}%
              </div>
              <div className="text-xs text-purple-700">平均相性度</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ユーザー比較カードのProps
interface UserComparisonCardProps {
  user: SteamUser;
  library?: GameLibrary;
  position: UserPosition;
  isCurrentUser?: boolean;
  className?: string;
  children?: ReactNode;
}

// ユーザー比較カード - 左右対称レイアウトの基本単位
export function UserComparisonCard({ 
  user, 
  library, 
  position, 
  isCurrentUser = false,
  className = '',
  children 
}: UserComparisonCardProps) {
  const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}分`;
    if (hours < 24) return `${hours}時間`;
    const days = Math.floor(hours / 24);
    return `${days}日 ${hours % 24}時間`;
  };

  const totalPlaytime = library?.games.reduce((sum, game) => sum + game.playtimeForever, 0) || 0;
  const topGames = library?.games
    .filter(game => game.playtimeForever > 0)
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, 5) || [];

  // ジャンル統計の計算
  const genreStats = library?.games.reduce((acc, game) => {
    if (game.genres && game.playtimeForever > 30) { // 30分以上プレイしたゲームのみ
      game.genres.forEach(genre => {
        acc[genre] = (acc[genre] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const topGenres = Object.entries(genreStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre, count]) => ({ genre, count }));

  const handleProfileClick = () => {
    if (user.profileUrl) {
      window.open(user.profileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* ユーザー情報ヘッダー */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.personaName || 'Steam Avatar'} 
              className="w-16 h-16 rounded-full cursor-pointer hover:opacity-80 transition-opacity shadow-md"
              onClick={handleProfileClick}
              title="Steamプロフィールを開く"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.personaName || 'Steam ユーザー'}
            </h3>
            {isCurrentUser && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                あなた
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Steam ID: {user.steamId}
          </p>
          {user.profileUrl && (
            <button
              onClick={handleProfileClick}
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              プロフィールを表示
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ゲーム統計 */}
      {library && (
        <div className="space-y-6">
          {/* 基本統計 */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {library.totalCount.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 font-medium">ゲーム</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {formatPlaytime(totalPlaytime)}
              </div>
              <div className="text-sm text-green-700 font-medium">総プレイ時間</div>
            </div>
          </div>

          {/* 追加統計 */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-600">
                {topGames.length}
              </div>
              <div className="text-xs text-purple-700">プレイ済み</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3">
              <div className="text-lg font-bold text-orange-600">
                {topGenres.length}
              </div>
              <div className="text-xs text-orange-700">ジャンル</div>
            </div>
          </div>

          {/* トップジャンル */}
          {topGenres.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                好みのジャンル
              </h4>
              <div className="space-y-2">
                {topGenres.map((genreInfo, index) => (
                  <div key={genreInfo.genre} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 font-medium w-4">
                        {index + 1}.
                      </span>
                      <span className="font-medium truncate">
                        {genreInfo.genre}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                      {genreInfo.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* トップゲーム */}
          {topGames.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                トップゲーム
              </h4>
              <div className="space-y-2">
                {topGames.map((game, index) => (
                  <div key={game.appId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 font-medium w-4">
                        {index + 1}.
                      </span>
                      <span className="font-medium truncate">
                        {game.name}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {formatPlaytime(game.playtimeForever)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 追加コンテンツ */}
      {children && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

// 中央結果パネルのProps
interface CentralResultsPanelProps {
  result?: CompatibilityResult;
  loading?: boolean;
  error?: string;
  className?: string;
  children?: ReactNode;
}

// 中央結果パネル - 相性分析結果を表示
export function CentralResultsPanel({ 
  result, 
  loading = false, 
  error,
  className = '',
  children 
}: CentralResultsPanelProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">相性分析中...</h3>
          <p className="text-sm text-gray-600">
            ゲームライブラリを比較して相性を計算しています
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">相性診断を開始</h3>
          <p className="text-sm text-gray-600">
            Steam IDを入力して相性診断を実行してください
          </p>
        </div>
        {children}
      </div>
    );
  }

  // 相性スコアに基づく色とアイコンの決定
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🔥';
    if (score >= 60) return '👍';
    if (score >= 40) return '👌';
    return '🤔';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return '素晴らしい相性！';
    if (score >= 60) return '良い相性です';
    if (score >= 40) return 'まずまずの相性';
    return '相性を改善できそう';
  };

  const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}分`;
    if (hours < 24) return `${hours}時間`;
    const days = Math.floor(hours / 24);
    return `${days}日 ${hours % 24}時間`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {/* 相性スコアヘッダー */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center border-b">
        <div className="relative inline-block">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
            {result.score}%
          </div>
          <div className="absolute -top-2 -right-2">
            <span className="text-3xl">{getScoreIcon(result.score)}</span>
          </div>
        </div>
        <p className="text-lg text-gray-700 font-medium mb-1">
          ゲーミング相性
        </p>
        <p className="text-sm text-gray-600">
          {getScoreMessage(result.score)}
        </p>
      </div>

      <div className="p-6">
        {/* 統計サマリー */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {result.commonGames.length}
            </div>
            <div className="text-sm text-green-700 font-medium">共通ゲーム</div>
          </div>
          <div className="text-center bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {result.coopSuggestions.length}
            </div>
            <div className="text-sm text-purple-700 font-medium">Co-op提案</div>
          </div>
          <div className="text-center bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {result.genreCompatibility.length}
            </div>
            <div className="text-sm text-orange-700 font-medium">共通ジャンル</div>
          </div>
        </div>

        {/* プレイ時間比較 */}
        {result.playtimeCompatibility && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              プレイ時間分析
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">類似プレイ時間ゲーム:</span>
                  <span className="font-semibold ml-2 text-blue-600">
                    {result.playtimeCompatibility.similarPlaytimeGames}ゲーム
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">相関係数:</span>
                  <span className="font-semibold ml-2 text-green-600">
                    {(result.playtimeCompatibility.playtimeCorrelation * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">総共通プレイ時間:</span>
                  <span className="font-semibold ml-2 text-purple-600">
                    {formatPlaytime(result.playtimeCompatibility.totalCommonPlaytime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 詳細結果セクション */}
        <div className="space-y-8">
          {/* 共通ゲーム */}
          {result.commonGames.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                共通ゲーム（上位5つ）
              </h4>
              <div className="space-y-3">
                {result.commonGames.slice(0, 5).map((game, index) => (
                  <div key={game.appId} className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="bg-green-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-900">{game.name}</span>
                        {game.isCoopSupported && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                            Co-op対応
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full">
                        相性度: {Math.round(game.compatibilityFactor * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ユーザー1:</span>
                        <span className="font-medium text-blue-600">
                          {formatPlaytime(game.user1Playtime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ユーザー2:</span>
                        <span className="font-medium text-blue-600">
                          {formatPlaytime(game.user2Playtime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Co-opゲーム提案 */}
          {result.coopSuggestions.length > 0 && (
            <CoopSuggestions 
              suggestions={result.coopSuggestions}
              maxDisplay={3}
              showDetails={true}
            />
          )}

          {/* ジャンル相性 */}
          {result.genreCompatibility.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                ジャンル相性（上位5つ）
              </h4>
              <div className="space-y-3">
                {result.genreCompatibility
                  .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
                  .slice(0, 5)
                  .map((genre, index) => (
                    <div key={genre.genre} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="bg-orange-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-gray-900">{genre.genre}</span>
                        </div>
                        <span className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                          {Math.round(genre.compatibilityScore)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-blue-600 font-medium">{genre.user1Count}</div>
                          <div className="text-gray-500 text-xs">ユーザー1</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-600 font-medium">{genre.commonCount}</div>
                          <div className="text-gray-500 text-xs">共通</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 font-medium">{genre.user2Count}</div>
                          <div className="text-gray-500 text-xs">ユーザー2</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 追加コンテンツ */}
        {children && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// 3カラムレイアウトのProps
interface CompatibilityResultsLayoutProps {
  leftUser?: SteamUser;
  leftLibrary?: GameLibrary;
  rightUser?: SteamUser;
  rightLibrary?: GameLibrary;
  result?: CompatibilityResult;
  loading?: boolean;
  error?: string;
  currentUserSteamId?: string;
  className?: string;
  children?: ReactNode;
}

// 3カラムレイアウト - 左右対称な相性結果表示
export function CompatibilityResultsLayout({
  leftUser,
  leftLibrary,
  rightUser,
  rightLibrary,
  result,
  loading = false,
  error,
  currentUserSteamId,
  className = '',
  children
}: CompatibilityResultsLayoutProps) {
  const screenSize = useScreenSize();

  // モバイル表示: 縦積みレイアウト
  if (screenSize === 'mobile') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* ユーザー1 */}
        {leftUser && (
          <UserComparisonCard
            user={leftUser}
            library={leftLibrary}
            position="left"
            isCurrentUser={leftUser.steamId === currentUserSteamId}
          />
        )}

        {/* 中央結果パネル */}
        <CentralResultsPanel
          result={result}
          loading={loading}
          error={error}
        >
          {children}
        </CentralResultsPanel>

        {/* ユーザー2 */}
        {rightUser && (
          <UserComparisonCard
            user={rightUser}
            library={rightLibrary}
            position="right"
            isCurrentUser={rightUser.steamId === currentUserSteamId}
          />
        )}
      </div>
    );
  }

  // タブレット表示: 2カラムレイアウト（上：ユーザー情報、下：結果）
  if (screenSize === 'tablet') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 上段: ユーザー情報を横並び */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {leftUser ? (
              <UserComparisonCard
                user={leftUser}
                library={leftLibrary}
                position="left"
                isCurrentUser={leftUser.steamId === currentUserSteamId}
                className="h-full"
              />
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center h-full">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500">ユーザー1</p>
              </div>
            )}
          </div>
          <div>
            {rightUser ? (
              <UserComparisonCard
                user={rightUser}
                library={rightLibrary}
                position="right"
                isCurrentUser={rightUser.steamId === currentUserSteamId}
                className="h-full"
              />
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center h-full">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500">ユーザー2</p>
              </div>
            )}
          </div>
        </div>

        {/* 下段: 相性結果 */}
        <CentralResultsPanel
          result={result}
          loading={loading}
          error={error}
        >
          {children}
        </CentralResultsPanel>
      </div>
    );
  }

  // デスクトップ表示: 3カラムレイアウト
  return (
    <div className={`grid lg:grid-cols-3 gap-6 ${className}`}>
      {/* 左カラム: ユーザー1 */}
      <div className="lg:col-span-1">
        {leftUser ? (
          <UserComparisonCard
            user={leftUser}
            library={leftLibrary}
            position="left"
            isCurrentUser={leftUser.steamId === currentUserSteamId}
            className="sticky top-4"
          />
        ) : (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center sticky top-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500">ユーザー1</p>
          </div>
        )}
      </div>

      {/* 中央カラム: 相性結果 */}
      <div className="lg:col-span-1">
        <CentralResultsPanel
          result={result}
          loading={loading}
          error={error}
        >
          {children}
        </CentralResultsPanel>
      </div>

      {/* 右カラム: ユーザー2 */}
      <div className="lg:col-span-1">
        {rightUser ? (
          <UserComparisonCard
            user={rightUser}
            library={rightLibrary}
            position="right"
            isCurrentUser={rightUser.steamId === currentUserSteamId}
            className="sticky top-4"
          />
        ) : (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center sticky top-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500">ユーザー2</p>
          </div>
        )}
      </div>
    </div>
  );
}

// デュアルユーザーセットアップのProps
interface DualUserSetupProps {
  currentUser: SteamUser;
  currentLibrary?: GameLibrary;
  onCompatibilityResult?: (result: CompatibilityResult, targetUser: SteamUser, targetLibrary: GameLibrary) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: ReactNode;
}

// デュアルユーザーセットアップ - 認証後の左右対称UI基盤
export function DualUserSetup({
  currentUser,
  currentLibrary,
  onCompatibilityResult,
  onError,
  className = '',
  children
}: DualUserSetupProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Steam相性診断
        </h2>
        <p className="text-gray-600">
          あなたと友達のゲーミング相性を分析します
        </p>
      </div>

      {/* 左右対称レイアウト */}
      <CompatibilityResultsLayout
        leftUser={currentUser}
        leftLibrary={currentLibrary}
        currentUserSteamId={currentUser.steamId}
      >
        {/* 中央パネル内のコンテンツ */}
        {children}
      </CompatibilityResultsLayout>
    </div>
  );
}

// メインのデュアルユーザーインターフェース
interface DualUserInterfaceProps {
  currentUser: SteamUser;
  currentLibrary?: GameLibrary;
  targetUser?: SteamUser;
  targetLibrary?: GameLibrary;
  compatibilityResult?: CompatibilityResult;
  loading?: boolean;
  error?: string;
  onNewDiagnosis?: () => void;
  className?: string;
  children?: ReactNode;
}

// デュアルユーザーインターフェース - 完全な左右対称UI
export function DualUserInterface({
  currentUser,
  currentLibrary,
  targetUser,
  targetLibrary,
  compatibilityResult,
  loading = false,
  error,
  onNewDiagnosis,
  className = '',
  children
}: DualUserInterfaceProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Steam相性診断結果
        </h2>
        {targetUser && (
          <p className="text-gray-600">
            {currentUser.personaName} と {targetUser.personaName} の相性分析
          </p>
        )}
        {onNewDiagnosis && (
          <button
            onClick={onNewDiagnosis}
            className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            新しい診断を開始 →
          </button>
        )}
      </div>

      {/* 左右対称レイアウト */}
      <CompatibilityResultsLayout
        leftUser={currentUser}
        leftLibrary={currentLibrary}
        rightUser={targetUser}
        rightLibrary={targetLibrary}
        result={compatibilityResult}
        loading={loading}
        error={error}
        currentUserSteamId={currentUser.steamId}
      >
        {children}
      </CompatibilityResultsLayout>
    </div>
  );
}