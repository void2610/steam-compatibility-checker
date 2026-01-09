'use client';

import { useState, useCallback } from 'react';
import { steamApiClientService } from '@/services/steam-api-client';
import { CompatibilityAnalyzer } from '@/services/compatibility-analyzer';
import { CompatibilityResult } from '@/types/compatibility';
import { GameLibrary, SteamUser } from '@/types/steam';

// フォーム入力状態の型定義
interface FormInputState {
  value: string;
  isValid: boolean;
  error?: string;
  touched: boolean;
}

// 公開相性診断フォームの状態
interface PublicCompatibilityFormState {
  user1Input: FormInputState;
  user2Input: FormInputState;
  isSubmitting: boolean;
  submitError?: string;
  currentStep: 'input' | 'resolving' | 'fetching' | 'analyzing';
  progress: string;
}

// 公開相性診断フォームのProps
interface PublicCompatibilityFormProps {
  onResult?: (
    result: CompatibilityResult, 
    user1Data: { user: SteamUser; library: GameLibrary },
    user2Data: { user: SteamUser; library: GameLibrary }
  ) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
}

export function PublicCompatibilityForm({ 
  onResult, 
  onError, 
  onLoadingChange,
  className = '' 
}: PublicCompatibilityFormProps) {
  const [formState, setFormState] = useState<PublicCompatibilityFormState>({
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
  const updateProgress = useCallback((step: PublicCompatibilityFormState['currentStep'], message: string) => {
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
      console.log('公開相性診断開始:', {
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
      const users = await steamApiClientService.getPlayerSummaries([user1SteamId, user2SteamId]);
      
      if (!users || users.length < 2) {
        throw new Error('ユーザー情報を取得できませんでした');
      }
      
      // Steam IDでユーザーを正しくマッピング
      const user1 = users.find(u => u.steamId === user1SteamId);
      const user2 = users.find(u => u.steamId === user2SteamId);
      
      if (!user1 || !user2) {
        throw new Error('ユーザー情報のマッピングに失敗しました');
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Steam相性診断</h3>
        <p className="text-sm text-gray-600">
          2人のSteam IDまたはプロフィールURLを入力して、ゲーミング相性を診断しましょう。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ユーザー1入力フィールド */}
        <div>
          <label htmlFor="user1SteamId" className="block text-sm font-medium text-gray-700 mb-2">
            ユーザー1 - Steam ID / プロフィールURL
          </label>
          <div className="relative">
            <input
              id="user1SteamId"
              type="text"
              value={formState.user1Input.value}
              onChange={(e) => handleInputChange('user1Input', e.target.value)}
              placeholder="例: 76561198000000000 または https://steamcommunity.com/id/username"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formState.user1Input.touched
                  ? formState.user1Input.isValid
                    ? 'border-green-300 focus:border-green-500'
                    : 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              disabled={formState.isSubmitting}
            />
            {formState.user1Input.touched && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {formState.user1Input.isValid ? (
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            )}
          </div>
          
          {/* エラーメッセージ */}
          {formState.user1Input.touched && formState.user1Input.error && (
            <p className="mt-1 text-sm text-red-600">{formState.user1Input.error}</p>
          )}
          
          {/* ヘルプテキスト */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <p className="mb-1">以下の形式で入力できます:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Steam ID: 17桁の数字（例: 76561198000000000）</li>
              <li>プロフィールURL: https://steamcommunity.com/profiles/[Steam ID]</li>
              <li>カスタムURL: https://steamcommunity.com/id/[カスタム名] または カスタム名のみ</li>
            </ul>
          </div>

        {/* 送信エラー */}
        {formState.submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{formState.submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isFormValid}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {formState.isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>診断中...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>相性診断を実行</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 診断中の進捗表示 */}
      {formState.isSubmitting && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">相性診断を実行中...</h4>
              <div className="mt-1 text-xs text-blue-700">
                <div className="space-y-1">
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
                  <div className="mt-2 text-blue-600 font-medium">
                    {formState.progress}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用方法の説明 */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">使用方法</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>1. 相性診断したい2人のSteam IDまたはプロフィールURLを入力</p>
          <p>2. 「相性診断を実行」ボタンをクリック</p>
          <p>3. 共通ゲーム、ジャンル相性、co-opゲーム提案などの詳細な分析結果を確認</p>
        </div>
        <div className="mt-2 text-xs text-amber-600">
          <p>※ 相性診断を行うには、両方のユーザーのプロフィールが公開されている必要があります。</p>
          <p>※ ログインは不要です。公開プロフィール情報のみを使用します。</p>
        </div>
      </div>
    </div>
  );
}