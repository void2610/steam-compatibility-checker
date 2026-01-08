'use client';

import { useState } from 'react';
import { useSteamAuth } from '@/contexts/SteamAuthContext';
import { steamApiClientService } from '@/services/steam-api-client';
import { CompatibilityAnalyzer } from '@/services/compatibility-analyzer';
import { 
  DualUserSetup, 
  DualUserInterface, 
  CompatibilityResultsLayout 
} from './DualUserInterface';
import { CompatibilityForm } from './CompatibilityForm';
import { GameLibrary, SteamUser } from '@/types/steam';
import { CompatibilityResult } from '@/types/compatibility';

// デュアルユーザーインターフェースのデモコンポーネント
export function DualUserInterfaceDemo() {
  const { user: currentUser } = useSteamAuth();
  const [currentLibrary, setCurrentLibrary] = useState<GameLibrary | null>(null);
  const [targetUser, setTargetUser] = useState<SteamUser | null>(null);
  const [targetLibrary, setTargetLibrary] = useState<GameLibrary | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 現在のユーザーのライブラリを取得
  const loadCurrentUserLibrary = async () => {
    if (!currentUser || currentLibrary) return;
    
    try {
      setLoading(true);
      const library = await steamApiClientService.getOwnedGames(currentUser.steamId);
      setCurrentLibrary(library);
    } catch (err) {
      console.error('ライブラリ取得エラー:', err);
      setError(err instanceof Error ? err.message : 'ライブラリの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 相性診断結果の処理
  const handleCompatibilityResult = (result: CompatibilityResult, user: SteamUser, library: GameLibrary) => {
    setCompatibilityResult(result);
    setTargetUser(user);
    setTargetLibrary(library);
    setError(null);
  };

  // 相性診断エラーの処理
  const handleCompatibilityError = (errorMessage: string) => {
    setError(errorMessage);
    setCompatibilityResult(null);
    setTargetUser(null);
    setTargetLibrary(null);
  };

  // 新しい診断を開始
  const startNewDiagnosis = () => {
    setCompatibilityResult(null);
    setTargetUser(null);
    setTargetLibrary(null);
    setError(null);
  };

  // 認証されていない場合
  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          ログインが必要です
        </h3>
        <p className="text-gray-600">
          Steam相性診断を使用するには、Steamアカウントでログインしてください。
        </p>
      </div>
    );
  }

  // 現在のユーザーのライブラリを自動取得
  if (!currentLibrary && !loading) {
    loadCurrentUserLibrary();
  }

  // 相性診断結果がある場合は完全なDualUserInterfaceを表示
  if (compatibilityResult && targetUser) {
    return (
      <DualUserInterface
        currentUser={currentUser}
        currentLibrary={currentLibrary || undefined}
        targetUser={targetUser}
        targetLibrary={targetLibrary || undefined}
        compatibilityResult={compatibilityResult}
        loading={loading}
        error={error || undefined}
        onNewDiagnosis={startNewDiagnosis}
      />
    );
  }

  // 初期状態: DualUserSetupを表示
  return (
    <div className="space-y-8">
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
        leftLibrary={currentLibrary || undefined}
        currentUserSteamId={currentUser.steamId}
        loading={loading}
        error={error || undefined}
      >
        {/* 中央パネル内の相性診断フォーム */}
        <div className="mt-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              相性診断を開始
            </h3>
            <p className="text-sm text-gray-600">
              比較したい相手のSteam IDまたはプロフィールURLを入力してください
            </p>
          </div>
          
          {/* 相性診断フォーム */}
          <CompatibilityForm
            onResult={handleCompatibilityResult}
            onError={handleCompatibilityError}
          />
        </div>
      </CompatibilityResultsLayout>

      {/* 使用方法の説明 */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          左右対称UIの特徴
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">🎯 対等な比較</h4>
            <p>あなたと相手を同じ重要度で表示し、公平な比較を実現します。</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📱 レスポンシブ対応</h4>
            <p>デスクトップでは3カラム、モバイルでは縦積みレイアウトに自動調整されます。</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📊 中央集約結果</h4>
            <p>相性スコアや共通ゲームなどの分析結果を中央に集約して表示します。</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔄 動的更新</h4>
            <p>診断結果に応じてレイアウトが動的に更新され、最適な表示を提供します。</p>
          </div>
        </div>
      </div>
    </div>
  );
}