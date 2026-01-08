'use client';

import { useState, useEffect } from 'react';
import { LoginButton, AuthStateWrapper } from "@/components/LoginButton";
import { UserProfileCard } from "@/components/UserProfile";
import { GameLibraryDisplay } from "@/components/GameLibraryDisplay";
import { CompatibilityForm } from "@/components/CompatibilityForm";
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
  };

  // 相性診断エラーの処理
  const handleCompatibilityError = (error: string) => {
    console.error('相性診断エラー:', error);
    // エラーは CompatibilityForm 内で表示されるため、ここでは特に何もしない
  };

  // 新しい診断を開始
  const startNewDiagnosis = () => {
    setCompatibilityResult(null);
    setTargetUser(null);
    setTargetLibrary(null);
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

        <main className="max-w-6xl mx-auto space-y-8">
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
              // 認証済みユーザー向けのコンテンツ
              <>
                {/* ユーザープロフィールとライブラリ */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <UserProfileCard 
                      user={user}
                      gameCount={userLibrary?.totalCount}
                      totalPlaytime={userLibrary?.games.reduce((sum, game) => sum + game.playtimeForever, 0)}
                    />
                    
                    {/* 相性診断フォーム */}
                    {!compatibilityResult && (
                      <CompatibilityForm
                        onResult={handleCompatibilityResult}
                        onError={handleCompatibilityError}
                      />
                    )}

                    {/* 相性診断結果 */}
                    {compatibilityResult && targetUser && (
                      <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">相性診断結果</h3>
                          <button
                            onClick={startNewDiagnosis}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            新しい診断
                          </button>
                        </div>
                        
                        <div className="text-center mb-6">
                          <div className="text-4xl font-bold text-blue-600 mb-2">
                            {compatibilityResult.score}%
                          </div>
                          <p className="text-gray-600">
                            {user.personaName} と {targetUser.personaName} の相性
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <div className="text-lg font-semibold text-green-600">
                              {compatibilityResult.commonGames.length}
                            </div>
                            <div className="text-gray-500">共通ゲーム</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-purple-600">
                              {compatibilityResult.coopSuggestions.length}
                            </div>
                            <div className="text-gray-500">Co-op提案</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-orange-600">
                              {compatibilityResult.genreCompatibility.length}
                            </div>
                            <div className="text-gray-500">共通ジャンル</div>
                          </div>
                        </div>

                        {compatibilityResult.commonGames.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium text-gray-900 mb-3">
                              共通ゲーム（上位5つ）
                            </h4>
                            <div className="space-y-2">
                              {compatibilityResult.commonGames.slice(0, 5).map((game) => (
                                <div key={game.appId} className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{game.name}</span>
                                  <span className="text-gray-500">
                                    相性度: {Math.round(game.compatibilityFactor * 100)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {compatibilityResult.coopSuggestions.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium text-gray-900 mb-3">
                              Co-opゲーム提案（上位3つ）
                            </h4>
                            <div className="space-y-2">
                              {compatibilityResult.coopSuggestions.slice(0, 3).map((coop) => (
                                <div key={coop.appId} className="flex items-center justify-between text-sm">
                                  <div>
                                    <span className="font-medium">{coop.name}</span>
                                    <span className="text-gray-500 ml-2">
                                      ({coop.coopType === 'local' ? 'ローカル' : 
                                        coop.coopType === 'online' ? 'オンライン' : 'ローカル/オンライン'})
                                    </span>
                                  </div>
                                  <span className="text-gray-500">
                                    最大{coop.maxPlayers}人
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <GameLibraryDisplay
                      library={userLibrary}
                      user={user}
                      loading={{ isLoading: libraryLoading, message: 'ゲームライブラリを取得中...' }}
                      error={libraryError}
                      maxGamesDisplay={20}
                    />
                    
                    {/* API Key設定エラーの場合の特別な案内 */}
                    {libraryError && libraryError.includes('Steam API key') && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">設定が必要です</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>Steam Web API Keyが設定されていません。</p>
                              <p className="mt-1">
                                <a 
                                  href="https://steamcommunity.com/dev/apikey" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline hover:text-yellow-900"
                                >
                                  Steam Web API Key
                                </a>
                                を取得して、環境変数 <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_STEAM_API_KEY</code> に設定してください。
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ターゲットユーザーのライブラリ表示 */}
                {targetUser && targetLibrary && (
                  <div className="mt-8">
                    <GameLibraryDisplay
                      library={targetLibrary}
                      user={targetUser}
                      maxGamesDisplay={20}
                      showSearch={false}
                    />
                  </div>
                )}
              </>
            ) : (
              // 未認証ユーザー向けのコンテンツ
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
            )}
          </AuthStateWrapper>
        </main>
      </div>
    </div>
  );
}
