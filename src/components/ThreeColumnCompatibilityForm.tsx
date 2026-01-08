'use client';

import { useState, useCallback } from 'react';
import { steamApiClientService } from '@/services/steam-api-client';
import { CompatibilityAnalyzer } from '@/services/compatibility-analyzer';
import { CompatibilityResult } from '@/types/compatibility';
import { GameLibrary, SteamUser } from '@/types/steam';
import { UserInputCard } from './UserInputCard';
import { useScreenSize } from './ResponsiveLayout';

// フォーム入力状態の型定義
interface FormInputState {
  value: string;
  isValid: boolean;
  error?: string;
  touched: boolean;
}

// 3カラム相性診断フォームの状態
interface ThreeColumnCompatibilityFormState {
  user1Input: FormInputState;
  user2Input: FormInputState;
  isSubmitting: boolean;
  submitError?: string;
  currentStep: 'input' | 'resolving' | 'fetching' | 'analyzing';
  progress: string;
}

// 3カラム相性診断フォームのProps
interface ThreeColumnCompatibilityFormProps {
  onResult?: (
    result: CompatibilityResult, 
    user1Data: { user: SteamUser; library: GameLibrary },
    user2Data: { user: SteamUser; library: GameLibrary }
  ) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
}

export function ThreeColumnCompatibilityForm({ 
  onResult, 
  onError, 
  onLoadingChange,
  className = '' 
}: ThreeColumnCompatibilityFormProps) {
  const screenSize = useScreenSize();
  const [formState, setFormState] = useState<ThreeColumnCompatibilityFormState>({
    user1Input: {
      value: '',
      isValid: false,
      touched: false
    },
    user2Input: {
      value: '',
      isValid: false,
      touched: false
    },
    isSubmitting: false,
    currentStep: 'input',
    progress: ''
  });

  // Steam ID/URLの検証
  const validateSteamId = useCallback((input: string): { isValid: boolean; error?: string } => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      return { isValid: false, error: 'Steam IDまたはプロフィールURLを入力してください' };
    }

    // Steam ID形式（17桁の数字）
    if (/^\d{17}$/.test(trimmedInput)) {
      return { isValid: true };
    }

    // プロフィールURL形式
    if (trimmedInput.includes('steamcommunity.com/')) {
      if (trimmedInput.includes('/profiles/') || trimmedInput.includes('/id/')) {
        return { isValid: true };
      }
      return { isValid: false, error: '有効なSteamプロフィールURLを入力してください' };
    }

    // バニティURL形式（英数字、アンダースコア、ハイフンのみ）
    if (/^[a-zA-Z0-9_-]+$/.test(trimmedInput) && trimmedInput.length >= 3) {
      return { isValid: true };
    }

    return { 
      isValid: false, 
      error: 'Steam ID（17桁の数字）、プロフィールURL、またはカスタムURLを入力してください' 
    };
  }, []);

  // 入力値の変更処理
  const handleInputChange = useCallback((field: 'user1Input' | 'user2Input', value: string) => {
    const validation = validateSteamId(value);
    
    setFormState(prev => {
      const newState = {
        ...prev,
        [field]: {
          value,
          isValid: validation.isValid,
          error: validation.error,
          touched: true
        },
        submitError: undefined
      };

      // 同じ値が入力されていないかチェック
      const otherField = field === 'user1Input' ? 'user2Input' : 'user1Input';
      const otherValue = prev[otherField].value.trim();
      const currentValue = value.trim();

      if (currentValue && otherValue && currentValue === otherValue) {
        newState[field].isValid = false;
        newState[field].error = '同じユーザーを指定することはできません';
      }

      return newState;
    });
  }, [validateSteamId]);

  // 進捗更新
  const updateProgress = useCallback((step: ThreeColumnCompatibilityFormState['currentStep'], message: string) => {
    setFormState(prev => ({
      ...prev,
      currentStep: step,
      progress: message
    }));
  }, []);

  // フォーム送信処理
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.user1Input.isValid || !formState.user2Input.isValid) {
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, submitError: undefined }));
    onLoadingChange?.(true);

    try {
      console.log('3カラム相性診断開始:', {
        user1Input: formState.user1Input.value,
        user2Input: formState.user2Input.value
      });

      // Steam IDを解決
      updateProgress('resolving', 'Steam IDを解決中...');
      const [user1SteamId, user2SteamId] = await Promise.all([
        steamApiClientService.resolveSteamId(formState.user1Input.value),
        steamApiClientService.resolveSteamId(formState.user2Input.value)
      ]);

      console.log('解決されたSteam ID:', { user1SteamId, user2SteamId });
      
      // 同じユーザーでないことを確認
      if (user1SteamId === user2SteamId) {
        throw new Error('同じユーザーを指定することはできません');
      }
      
      // ユーザー情報を取得
      updateProgress('fetching', 'ユーザー情報を取得中...');
      const [user1, user2] = await steamApiClientService.getPlayerSummaries([user1SteamId, user2SteamId]);
      
      if (!user1 || !user2) {
        throw new Error('ユーザー情報を取得できませんでした');
      }
      
      console.log('ユーザー情報取得完了:', { 
        user1: user1.personaName, 
        user2: user2.personaName 
      });

      // ゲームライブラリを取得
      updateProgress('fetching', 'ゲームライブラリを取得中...');
      const [user1Library, user2Library] = await Promise.all([
        steamApiClientService.getOwnedGames(user1SteamId),
        steamApiClientService.getOwnedGames(user2SteamId)
      ]);

      console.log('ライブラリ取得完了:', { 
        user1Games: user1Library.totalCount,
        user2Games: user2Library.totalCount 
      });

      // プロフィールが非公開かチェック
      if (!user1Library.isPublic) {
        throw new Error(`${user1.personaName}のプロフィールが非公開のため、相性診断を実行できません。`);
      }

      if (!user2Library.isPublic) {
        throw new Error(`${user2.personaName}のプロフィールが非公開のため、相性診断を実行できません。`);
      }

      // 相性分析を実行
      updateProgress('analyzing', '相性分析を実行中...');
      const analyzer = new CompatibilityAnalyzer();
      const result = analyzer.analyze(
        user1Library, 
        user2Library, 
        user1SteamId, 
        user2SteamId
      );
      
      console.log('相性分析完了:', result.score);

      // 結果を返す
      onResult?.(result, { user: user1, library: user1Library }, { user: user2, library: user2Library });

      // フォームをリセット
      setFormState({
        user1Input: {
          value: '',
          isValid: false,
          touched: false
        },
        user2Input: {
          value: '',
          isValid: false,
          touched: false
        },
        isSubmitting: false,
        currentStep: 'input',
        progress: ''
      });

    } catch (error) {
      console.error('相性診断エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '相性診断中にエラーが発生しました';
      setFormState(prev => ({ 
        ...prev, 
        submitError: errorMessage, 
        isSubmitting: false,
        currentStep: 'input',
        progress: ''
      }));
      onError?.(errorMessage);
    } finally {
      onLoadingChange?.(false);
    }
  }, [formState.user1Input, formState.user2Input, onResult, onError, onLoadingChange, updateProgress]);

  const isFormValid = formState.user1Input.isValid && formState.user2Input.isValid && !formState.isSubmitting;

  // モバイル表示: 縦積みレイアウト
  if (screenSize === 'mobile') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* ユーザー1入力 */}
        <UserInputCard
          userNumber={1}
          value={formState.user1Input.value}
          isValid={formState.user1Input.isValid}
          error={formState.user1Input.error}
          touched={formState.user1Input.touched}
          onChange={(value) => handleInputChange('user1Input', value)}
          disabled={formState.isSubmitting}
        />

        {/* 中央パネル */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">相性診断</h3>
            
            {/* 送信エラー */}
            {formState.submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{formState.submitError}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {formState.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>診断中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>相性診断を実行</span>
                </>
              )}
            </button>
          </div>

          {/* 診断中の進捗表示 */}
          {formState.isSubmitting && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-center">
                <h4 className="text-sm font-medium text-blue-900 mb-2">診断進行中...</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div className={formState.currentStep === 'resolving' ? 'font-medium' : ''}>
                    {formState.currentStep === 'resolving' ? '⏳' : '✓'} Steam IDを解決中
                  </div>
                  <div className={formState.currentStep === 'fetching' ? 'font-medium' : ''}>
                    {['fetching', 'analyzing'].includes(formState.currentStep) ? '⏳' : formState.currentStep === 'input' ? '' : '✓'} ユーザー情報とライブラリを取得中
                  </div>
                  <div className={formState.currentStep === 'analyzing' ? 'font-medium' : ''}>
                    {formState.currentStep === 'analyzing' ? '⏳' : ''} 相性分析を実行中
                  </div>
                </div>
                {formState.progress && (
                  <div className="mt-2 text-blue-600 font-medium text-sm">
                    {formState.progress}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ユーザー2入力 */}
        <UserInputCard
          userNumber={2}
          value={formState.user2Input.value}
          isValid={formState.user2Input.isValid}
          error={formState.user2Input.error}
          touched={formState.user2Input.touched}
          onChange={(value) => handleInputChange('user2Input', value)}
          disabled={formState.isSubmitting}
        />
      </div>
    );
  }

  // タブレット表示: 2カラムレイアウト
  if (screenSize === 'tablet') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 上段: ユーザー入力を横並び */}
        <div className="grid grid-cols-2 gap-4">
          <UserInputCard
            userNumber={1}
            value={formState.user1Input.value}
            isValid={formState.user1Input.isValid}
            error={formState.user1Input.error}
            touched={formState.user1Input.touched}
            onChange={(value) => handleInputChange('user1Input', value)}
            disabled={formState.isSubmitting}
          />
          <UserInputCard
            userNumber={2}
            value={formState.user2Input.value}
            isValid={formState.user2Input.isValid}
            error={formState.user2Input.error}
            touched={formState.user2Input.touched}
            onChange={(value) => handleInputChange('user2Input', value)}
            disabled={formState.isSubmitting}
          />
        </div>

        {/* 下段: 中央パネル */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">相性診断</h3>
            
            {/* 送信エラー */}
            {formState.submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{formState.submitError}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mx-auto"
            >
              {formState.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>診断中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>相性診断を実行</span>
                </>
              )}
            </button>

            {/* 診断中の進捗表示 */}
            {formState.isSubmitting && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">診断進行中...</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div className={formState.currentStep === 'resolving' ? 'font-medium' : ''}>
                      {formState.currentStep === 'resolving' ? '⏳' : '✓'} Steam IDを解決中
                    </div>
                    <div className={formState.currentStep === 'fetching' ? 'font-medium' : ''}>
                      {['fetching', 'analyzing'].includes(formState.currentStep) ? '⏳' : formState.currentStep === 'input' ? '' : '✓'} ユーザー情報とライブラリを取得中
                    </div>
                    <div className={formState.currentStep === 'analyzing' ? 'font-medium' : ''}>
                      {formState.currentStep === 'analyzing' ? '⏳' : ''} 相性分析を実行中
                    </div>
                  </div>
                  {formState.progress && (
                    <div className="mt-2 text-blue-600 font-medium text-sm">
                      {formState.progress}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // デスクトップ表示: 3カラムレイアウト
  return (
    <div className={`grid lg:grid-cols-3 gap-6 ${className}`}>
      {/* 左カラム: ユーザー1入力 */}
      <div className="lg:col-span-1">
        <UserInputCard
          userNumber={1}
          value={formState.user1Input.value}
          isValid={formState.user1Input.isValid}
          error={formState.user1Input.error}
          touched={formState.user1Input.touched}
          onChange={(value) => handleInputChange('user1Input', value)}
          disabled={formState.isSubmitting}
          className="sticky top-4"
        />
      </div>

      {/* 中央カラム: 診断ボタンと進捗 */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">相性診断</h3>
            <p className="text-sm text-gray-600 mb-6">
              両方のユーザー情報を入力して診断を開始
            </p>
            
            {/* 送信エラー */}
            {formState.submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{formState.submitError}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {formState.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>診断中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>相性診断を実行</span>
                </>
              )}
            </button>

            {/* 診断中の進捗表示 */}
            {formState.isSubmitting && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">診断進行中...</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div className={formState.currentStep === 'resolving' ? 'font-medium' : ''}>
                      {formState.currentStep === 'resolving' ? '⏳' : '✓'} Steam IDを解決中
                    </div>
                    <div className={formState.currentStep === 'fetching' ? 'font-medium' : ''}>
                      {['fetching', 'analyzing'].includes(formState.currentStep) ? '⏳' : formState.currentStep === 'input' ? '' : '✓'} ユーザー情報とライブラリを取得中
                    </div>
                    <div className={formState.currentStep === 'analyzing' ? 'font-medium' : ''}>
                      {formState.currentStep === 'analyzing' ? '⏳' : ''} 相性分析を実行中
                    </div>
                  </div>
                  {formState.progress && (
                    <div className="mt-2 text-blue-600 font-medium text-sm">
                      {formState.progress}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 使用方法の説明 */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-left">
              <h4 className="text-sm font-medium text-gray-900 mb-2">使用方法</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>1. 左右にそれぞれのSteam IDを入力</p>
                <p>2. 「相性診断を実行」ボタンをクリック</p>
                <p>3. 詳細な分析結果を確認</p>
              </div>
              <div className="mt-2 text-xs text-amber-600">
                <p>※ 両方のプロフィールが公開されている必要があります</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右カラム: ユーザー2入力 */}
      <div className="lg:col-span-1">
        <UserInputCard
          userNumber={2}
          value={formState.user2Input.value}
          isValid={formState.user2Input.isValid}
          error={formState.user2Input.error}
          touched={formState.user2Input.touched}
          onChange={(value) => handleInputChange('user2Input', value)}
          disabled={formState.isSubmitting}
          className="sticky top-4"
        />
      </div>
    </div>
  );
}