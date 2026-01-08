'use client';

import { useState, useCallback } from 'react';

// フォーム入力状態の型定義
interface FormInputState {
  value: string;
  isValid: boolean;
  error?: string;
  touched: boolean;
}

// ユーザー入力カードのProps
interface UserInputCardProps {
  userNumber: 1 | 2;
  value: string;
  isValid: boolean;
  error?: string;
  touched: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function UserInputCard({
  userNumber,
  value,
  isValid,
  error,
  touched,
  onChange,
  disabled = false,
  className = ''
}: UserInputCardProps) {
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

  // サンプル入力の設定
  const setSampleInput = useCallback((sample: string) => {
    onChange(sample);
  }, [onChange]);

  const samples = userNumber === 1 
    ? [
        { label: 'gaben', value: 'gaben' },
        { label: 'Robin Walker', value: 'https://steamcommunity.com/id/robinwalker' }
      ]
    : [
        { label: 'valve', value: 'valve' },
        { label: 'John Carmack', value: 'https://steamcommunity.com/id/johnc' }
      ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ユーザー{userNumber}
        </h3>
        <p className="text-sm text-gray-600">
          Steam IDまたはプロフィールURLを入力
        </p>
      </div>

      {/* 入力フィールド */}
      <div className="space-y-4">
        <div>
          <label htmlFor={`user${userNumber}SteamId`} className="block text-sm font-medium text-gray-700 mb-2">
            Steam ID / プロフィールURL
          </label>
          <div className="relative">
            <input
              id={`user${userNumber}SteamId`}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="例: 76561198000000000"
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched
                  ? isValid
                    ? 'border-green-300 focus:border-green-500'
                    : 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              disabled={disabled}
            />
            {touched && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isValid ? (
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
          {touched && error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* サンプル入力ボタン */}
        <div>
          <span className="text-xs text-gray-500 block mb-2">サンプル:</span>
          <div className="space-y-2">
            {samples.map((sample, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSampleInput(sample.value)}
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                disabled={disabled}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* ヘルプテキスト */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <p className="mb-1">入力可能な形式:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Steam ID: 17桁の数字</li>
            <li>プロフィールURL</li>
            <li>カスタムURL</li>
          </ul>
        </div>
      </div>
    </div>
  );
}