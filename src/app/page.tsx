'use client';

import { useState, useEffect } from 'react';
import { LoginButton, AuthStateWrapper } from "@/components/LoginButton";
import { CompatibilityForm } from "@/components/CompatibilityForm";
import { DualUserInterface, DualUserSetup } from "@/components/DualUserInterface";
import { useSteamAuth } from "@/contexts/SteamAuthContext";
import { steamApiClientService } from "@/services/steam-api-client";
import { GameLibrary, SteamUser } from "@/types/steam";
import { CompatibilityResult } from "@/types/compatibility";

export default function Home() {
  const { user, isLoading } = useSteamAuth();
  const [userLibrary, setUserLibrary] = useState<GameLibrary | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [targetUser, setTargetUser] = useState<SteamUser | null>(null);
  const [targetLibrary, setTargetLibrary] = useState<GameLibrary | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ユーザーのゲームライブラリを取得
  useEffect(() => {
    if (user && !userLibrary && !libraryLoading) {
      console.log('ユーザーライブラリ取得開始:', user.steamId);
      setLibraryLoading(true);
      setLibraryError(null);
      
      steamApiClientService.getOwnedGames(user.steamId)
        .then(library => {
          console.log('ライブラリ取得成功:', library.totalCount, 'ゲーム');
          setUserLibrary(library);
        })
        .catch(error => {
          console.error('ライブラリ取得エラー:', error);
          const errorMessage = error.message || 'ライブラリの取得に失敗しました';
          setLibraryError(errorMessage);
        })
        .finally(() => {
          setLibraryLoading(false);
        });
    }
  }, [user, userLibrary, libraryLoading]);

  // 相性診断結果の処理
  const handleCompatibilityResult = (result: CompatibilityResult, targetUser: SteamUser, targetLibrary: GameLibrary) => {
    setCompatibilityResult(result);
    setTargetUser(targetUser);
    setTargetLibrary(targetLibrary);
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
    setTargetUser(null);
    setTargetLibrary(null);
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
          <div className="flex justify-center">
            <LoginButton variant="full" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto">
          <AuthStateWrapper
            requireAuth={false}
            loadingComponent={
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-lg text-gray-600">読み込み中...</span>
              </div>
            }
          >
            {user ? (
              // 認証済みユーザー向けのコンテンツ - 新しいDualUserInterfaceを使用
              <>
                {compatibilityResult && targetUser && targetLibrary ? (
                  // 相性診断結果表示 - 新しい左右対称レイアウト
                  <DualUserInterface
                    currentUser={user}
                    currentLibrary={userLibrary || undefined}
                    targetUser={targetUser}
                    targetLibrary={targetLibrary}
                    compatibilityResult={compatibilityResult}
                    loading={analysisLoading}
                    error={analysisError || undefined}
                    onNewDiagnosis={startNewDiagnosis}
                  />
                ) : (
                  // 相性診断開始画面 - 左右対称レイアウト基盤
                  <DualUserSetup
                    currentUser={user}
                    currentLibrary={userLibrary || undefined}
                    onCompatibilityResult={handleCompatibilityResult}
                    onError={handleCompatibilityError}
                  >
                    {/* 中央パネル内の相性診断フォーム */}
                    <div className="mt-6">
                      <CompatibilityForm
                        onResult={handleCompatibilityResult}
                        onError={handleCompatibilityError}
                      />
                    </div>
                  </DualUserSetup>
                )}

                {/* ライブラリ取得エラーの表示 */}
                {libraryError && (
                  <div className="mt-8 max-w-4xl mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-yellow-800 mb-2">ライブラリ取得エラー</h3>
                          <p className="text-yellow-700 mb-4">{libraryError}</p>
                          {libraryError.includes('Steam API key') && (
                            <div className="text-sm text-yellow-700">
                              <p className="mb-2">Steam Web API Keyが設定されていません。</p>
                              <p>
                                <a 
                                  href="https://steamcommunity.com/dev/apikey" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline hover:text-yellow-900 font-medium"
                                >
                                  Steam Web API Key
                                </a>
                                を取得して、環境変数 <code className="bg-yellow-100 px-2 py-1 rounded font-mono">NEXT_PUBLIC_STEAM_API_KEY</code> に設定してください。
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 未認証ユーザー向けのコンテンツ
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Steam相性診断とは？
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        🎮 ゲームライブラリ比較
                      </h3>
                      <p className="text-gray-600">
                        あなたと友達のSteamライブラリを比較して、共通のゲームや相性度を分析します。
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        🤝 Co-opゲーム提案
                      </h3>
                      <p className="text-gray-600">
                        一緒に楽しめるco-opゲームを自動で提案し、新しいゲーム体験を発見できます。
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        📊 詳細な分析結果
                      </h3>
                      <p className="text-gray-600">
                        ジャンル相性、プレイ時間比較など、詳細な分析結果を視覚的に表示します。
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        🔗 結果シェア
                      </h3>
                      <p className="text-gray-600">
                        分析結果をシェア可能なURLで友達と共有し、ゲーミング嗜好について議論できます。
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      相性診断を開始するには、まずSteamアカウントでログインしてください。
                    </p>
                    <LoginButton variant="default" />
                  </div>
                </div>
              </div>
            )}
          </AuthStateWrapper>
        </main>
      </div>
    </div>
  );
}
