'use client';

import { useState, useCallback } from 'react';
import { steamApiClientService } from '@/services/steam-api-client';
import { CompatibilityAnalyzer } from '@/services/compatibility-analyzer';
import { useSteamAuth } from '@/contexts/SteamAuthContext';
import { CompatibilityResult } from '@/types/compatibility';
import { GameLibrary, SteamUser } from '@/types/steam';

// フォーム入力状態の型定義
interface FormInputState {
  value: string;
  isValid: boolean;
  error?: string;
  touched: boolean;
}

// 相性診断フォームの状態
interface CompatibilityFormState {
  steamIdInput: FormInputState;
  isSubmitting: boolean;
  submitError?: string;
}

// 相性診断フォームのProps
interface CompatibilityFormProps {
  onResult?: (result: CompatibilityResult, targetUser: SteamUser, targetLibrary: GameLibrary) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function CompatibilityForm({ onResult, onError, className = '' }: CompatibilityFormProps) {
  const { user: currentUser } = useSteamAuth();
  const [formState, setFormState] = useState<CompatibilityFormState>({
    steamIdInput: {
      value: '',
      isValid: false,
      touched: false
    },
    isSubmitting: false
  });

  // Steam ID/URLの検証
  const validateSteamId = useCallback((input: string): { isValid: boolean; error?: string } => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      return { isValid: false, error: 'Steam IDまたはプロフィールURLを入力してください' };
    }

    // 自分自身のIDをチェック
    if (currentUser && (
      trimmedInput === currentUser.steamId ||
      trimmedInput.includes(currentUser.steamId) ||
      trimmedInput.includes(currentUser.profileUrl?.split('/').pop() || '')
    )) {
      return { isValid: false, error: '自分自身との相性診断はできません' };
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
  }, [currentUser]);

  // 入力値の変更処理
  const handleInputChange = useCallback((value: string) => {
    const validation = validateSteamId(value);
    
    setFormState(prev => ({
      ...prev,
      steamIdInput: {
        value,
        isValid: validation.isValid,
        error: validation.error,
        touched: true
      },
      submitError: undefined
    }));
  }, [validateSteamId]);

  // フォーム送信処理
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      const error = 'ログインが必要です';
      setFormState(prev => ({ ...prev, submitError: error }));
      onError?.(error);
      return;
    }

    if (!formState.steamIdInput.isValid) {
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, submitError: undefined }));

    try {
      console.log('相性診断開始:', {
        currentUser: currentUser.steamId,
        targetInput: formState.steamIdInput.value
      });

      // Steam IDを解決
      console.log('Steam ID解決中...');
      const targetSteamId = await steamApiClientService.resolveSteamId(formState.steamIdInput.value);
      console.log('解決されたSteam ID:', targetSteamId);
      
      // ターゲットユーザーの情報を取得
      console.log('ユーザー情報取得中...');
      const [targetUser] = await steamApiClientService.getPlayerSummaries([targetSteamId]);
      if (!targetUser) {
        throw new Error('ユーザー情報を取得できませんでした');
      }
      console.log('ターゲットユーザー:', targetUser.personaName);

      // 現在のユーザーのライブラリを取得
      console.log('現在のユーザーのライブラリ取得中...');
      const currentUserLibrary = await steamApiClientService.getOwnedGames(currentUser.steamId);
      console.log('現在のユーザーのゲーム数:', currentUserLibrary.totalCount);
      
      // ターゲットユーザーのライブラリを取得
      console.log('ターゲットユーザーのライブラリ取得中...');
      const targetUserLibrary = await steamApiClientService.getOwnedGames(targetSteamId);
      console.log('ターゲットユーザーのゲーム数:', targetUserLibrary.totalCount);

      // プロフィールが非公開かチェック
      if (!currentUserLibrary.isPublic) {
        throw new Error('あなたのプロフィールが非公開のため、相性診断を実行できません。Steamプロフィール設定でゲーム詳細を公開してください。');
      }

      if (!targetUserLibrary.isPublic) {
        throw new Error('対象ユーザーのプロフィールが非公開のため、相性診断を実行できません。');
      }

      // 相性分析を実行
      console.log('相性分析実行中...');
      const analyzer = new CompatibilityAnalyzer();
      const result = analyzer.analyze(
        currentUserLibrary, 
        targetUserLibrary, 
        currentUser.steamId, 
        targetSteamId
      );
      console.log('相性分析完了:', result.score);

      // 結果を返す
      onResult?.(result, targetUser, targetUserLibrary);

      // フォームをリセット
      setFormState({
        steamIdInput: {
          value: '',
          isValid: false,
          touched: false
        },
        isSubmitting: false
      });

    } catch (error) {
      console.error('相性診断エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '相性診断中にエラーが発生しました';
      setFormState(prev => ({ ...prev, submitError: errorMessage, isSubmitting: false }));
      onError?.(errorMessage);
    }
  }, [currentUser, formState.steamIdInput, onResult, onError]);

  // サンプル入力の設定
  const setSampleInput = useCallback((sample: string) => {
    handleInputChange(sample);
  }, [handleInputChange]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">相性診断</h3>
        <p className="text-sm text-gray-600">
          Steam IDまたはプロフィールURLを入力して、ゲーミング相性を診断しましょう。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Steam ID入力フィールド */}
        <div>
          <label htmlFor="steamId" className="block text-sm font-medium text-gray-700 mb-2">
            Steam ID / プロフィールURL
          </label>
          <div className="relative">
            <input
              id="steamId"
              type="text"
              value={formState.steamIdInput.value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="例: 76561198000000000 または https://steamcommunity.com/id/username"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formState.steamIdInput.touched
                  ? formState.steamIdInput.isValid
                    ? 'border-green-300 focus:border-green-500'
                    : 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              disabled={formState.isSubmitting}
            />
            {formState.steamIdInput.touched && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {formState.steamIdInput.isValid ? (
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
          {formState.steamIdInput.touched && formState.steamIdInput.error && (
            <p className="mt-1 text-sm text-red-600">{formState.steamIdInput.error}</p>
          )}
          
          {/* ヘルプテキスト */}
          <div className="mt-2 text-xs text-gray-500">
            <p className="mb-1">以下の形式で入力できます:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Steam ID: 17桁の数字（例: 76561198000000000）</li>
              <li>プロフィールURL: https://steamcommunity.com/profiles/[Steam ID]</li>
              <li>カスタムURL: https://steamcommunity.com/id/[カスタム名] または カスタム名のみ</li>
            </ul>
          </div>
        </div>

        {/* サンプル入力ボタン */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">サンプル:</span>
          <button
            type="button"
            onClick={() => setSampleInput('gaben')}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
            disabled={formState.isSubmitting}
          >
            gaben
          </button>
          <button
            type="button"
            onClick={() => setSampleInput('https://steamcommunity.com/id/robinwalker')}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
            disabled={formState.isSubmitting}
          >
            Robin Walker
          </button>
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
            disabled={!formState.steamIdInput.isValid || formState.isSubmitting || !currentUser}
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
                  <div>✓ Steam IDを解決中</div>
                  <div>✓ ユーザー情報を取得中</div>
                  <div>✓ ゲームライブラリを取得中</div>
                  <div>⏳ 相性分析を実行中</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用方法の説明 */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">使用方法</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>1. 相性診断したい相手のSteam IDまたはプロフィールURLを入力</p>
          <p>2. 「相性診断を実行」ボタンをクリック</p>
          <p>3. 共通ゲーム、ジャンル相性、co-opゲーム提案などの詳細な分析結果を確認</p>
        </div>
        <div className="mt-2 text-xs text-amber-600">
          <p>※ 相性診断を行うには、あなたと相手の両方のプロフィールが公開されている必要があります。</p>
        </div>
      </div>
    </div>
  );
}

// 簡易版相性診断フォーム
interface QuickCompatibilityFormProps {
  onSubmit: (steamId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function QuickCompatibilityForm({ onSubmit, isLoading = false, className = '' }: QuickCompatibilityFormProps) {
  const [steamId, setSteamId] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (value: string) => {
    setSteamId(value);
    const trimmed = value.trim();
    setIsValid(
      /^\d{17}$/.test(trimmed) || 
      trimmed.includes('steamcommunity.com/') ||
      (/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length >= 3)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      onSubmit(steamId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex space-x-2 ${className}`}>
      <div className="flex-1">
        <input
          type="text"
          value={steamId}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Steam ID または プロフィールURL"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? '診断中...' : '診断'}
      </button>
    </form>
  );
}