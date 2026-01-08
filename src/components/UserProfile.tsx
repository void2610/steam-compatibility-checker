'use client';

import { useSteamAuth } from '@/contexts/SteamAuthContext';
import { SteamUser } from '@/types/steam';

// ユーザープロフィール表示コンポーネント
interface UserProfileProps {
  user?: SteamUser;
  showLogout?: boolean;
  compact?: boolean;
  className?: string;
}

export function UserProfile({ 
  user: propUser, 
  showLogout = true, 
  compact = false,
  className = '' 
}: UserProfileProps) {
  const { user: contextUser, logout } = useSteamAuth();
  const user = propUser || contextUser;

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    if (user.profileUrl) {
      window.open(user.profileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {user.avatarUrl && (
          <img 
            src={user.avatarUrl} 
            alt={user.personaName || 'Steam Avatar'} 
            className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
            title="Steamプロフィールを開く"
          />
        )}
        <span className="text-sm font-medium text-gray-700 truncate max-w-32">
          {user.personaName || `Steam ID: ${user.steamId}`}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.personaName || 'Steam Avatar'} 
              className="w-12 h-12 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
              title="Steamプロフィールを開く"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {user.personaName || 'Steam ユーザー'}
          </h3>
          <p className="text-sm text-gray-500">
            Steam ID: {user.steamId}
          </p>
          {user.profileUrl && (
            <button
              onClick={handleProfileClick}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              プロフィールを表示 →
            </button>
          )}
        </div>
        
        {showLogout && (
          <div className="flex-shrink-0">
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ユーザープロフィールカード（より詳細な表示用）
interface UserProfileCardProps {
  user: SteamUser;
  gameCount?: number;
  totalPlaytime?: number;
  className?: string;
}

export function UserProfileCard({ 
  user, 
  gameCount, 
  totalPlaytime,
  className = '' 
}: UserProfileCardProps) {
  const handleProfileClick = () => {
    if (user.profileUrl) {
      window.open(user.profileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}分`;
    if (hours < 24) return `${hours}時間`;
    const days = Math.floor(hours / 24);
    return `${days}日 ${hours % 24}時間`;
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 ${className}`}>
      <div className="flex items-start space-x-4">
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
          <h3 className="text-xl font-semibold text-gray-900 truncate mb-1">
            {user.personaName || 'Steam ユーザー'}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Steam ID: {user.steamId}
          </p>
          
          {(gameCount !== undefined || totalPlaytime !== undefined) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {gameCount !== undefined && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21,6H3A1,1 0 0,0 2,7V17A1,1 0 0,0 3,18H21A1,1 0 0,0 22,17V7A1,1 0 0,0 21,6M20,16H4V8H20V16Z"/>
                  </svg>
                  <span className="text-gray-700">
                    <span className="font-medium">{gameCount.toLocaleString()}</span> ゲーム
                  </span>
                </div>
              )}
              {totalPlaytime !== undefined && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                  </svg>
                  <span className="text-gray-700">
                    <span className="font-medium">{formatPlaytime(totalPlaytime)}</span> プレイ時間
                  </span>
                </div>
              )}
            </div>
          )}
          
          {user.profileUrl && (
            <button
              onClick={handleProfileClick}
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Steamプロフィールを表示
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}