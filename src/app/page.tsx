'use client';

import { useState } from 'react';
import { ThreeColumnCompatibilityForm } from "@/components/ThreeColumnCompatibilityForm";
import { DualUserInterface } from "@/components/DualUserInterface";
import { GameLibrary, SteamUser } from "@/types/steam";
import { CompatibilityResult } from "@/types/compatibility";

export default function Home() {
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [user1, setUser1] = useState<SteamUser | null>(null);
  const [user1Library, setUser1Library] = useState<GameLibrary | null>(null);
  const [user2, setUser2] = useState<SteamUser | null>(null);
  const [user2Library, setUser2Library] = useState<GameLibrary | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 相性診断結果の処理
  const handleCompatibilityResult = (
    result: CompatibilityResult, 
    user1Data: { user: SteamUser; library: GameLibrary },
    user2Data: { user: SteamUser; library: GameLibrary }
  ) => {
    setCompatibilityResult(result);
    setUser1(user1Data.user);
    setUser1Library(user1Data.library);
    setUser2(user2Data.user);
    setUser2Library(user2Data.library);
    setAnalysisLoading(false);
    setAnalysisError(null);
  };

  // 相性診断エラーの処理
  const handleCompatibilityError = (error: string) => {
    console.error('相性診断エラー:', error);
    setAnalysisError(error);
    setAnalysisLoading(false);
  };

  // 新しい診断を開始
  const startNewDiagnosis = () => {
    setCompatibilityResult(null);
    setUser1(null);
    setUser1Library(null);
    setUser2(null);
    setUser2Library(null);
    setAnalysisError(null);
    setAnalysisLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Steam相性診断
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Steamユーザー同士のゲーミング相性を分析するWebアプリケーション
          </p>
          <p className="text-sm text-gray-500">
            ログイン不要 - 公開プロフィール情報のみを使用
          </p>
        </header>

        <main className="max-w-7xl mx-auto">
          {compatibilityResult && user1 && user2 && user1Library && user2Library ? (
            // 相性診断結果表示 - 既存の3カラムレイアウトを維持
            <DualUserInterface
              currentUser={user1}
              currentLibrary={user1Library}
              targetUser={user2}
              targetLibrary={user2Library}
              compatibilityResult={compatibilityResult}
              loading={analysisLoading}
              error={analysisError || undefined}
              onNewDiagnosis={startNewDiagnosis}
            />
          ) : (
            // 相性診断開始画面 - 3カラムレイアウト
            <ThreeColumnCompatibilityForm
              onResult={handleCompatibilityResult}
              onError={handleCompatibilityError}
              onLoadingChange={setAnalysisLoading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
