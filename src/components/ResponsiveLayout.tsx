'use client';

import { ReactNode, useState, useEffect } from 'react';

// ブレークポイント定義
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// 画面サイズタイプ
export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

// 画面サイズフック
export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < breakpoints.md) {
        setScreenSize('mobile');
      } else if (width < breakpoints.lg) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    // 初期チェック
    checkScreenSize();

    // リサイズイベントリスナー
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
}

// レスポンシブコンテナのProps
interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// レスポンシブコンテナ
export function ResponsiveContainer({ 
  children, 
  className = '',
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 py-2',
    md: 'px-4 py-4',
    lg: 'px-6 py-6'
  };

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

// レスポンシブグリッドのProps
interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

// レスポンシブグリッド
export function ResponsiveGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridClasses = [
    'grid',
    gapClasses[gap],
    `grid-cols-${columns.mobile || 1}`,
    `md:grid-cols-${columns.tablet || 2}`,
    `lg:grid-cols-${columns.desktop || 3}`,
    className
  ].join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// モバイル対応スタックのProps
interface MobileStackProps {
  children: ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

// モバイル対応スタック - 小画面では縦積み
export function MobileStack({ 
  children, 
  spacing = 'md',
  className = ''
}: MobileStackProps) {
  const spacingClasses = {
    sm: 'space-y-2 lg:space-y-0 lg:space-x-2',
    md: 'space-y-4 lg:space-y-0 lg:space-x-4',
    lg: 'space-y-6 lg:space-y-0 lg:space-x-6'
  };

  return (
    <div className={`flex flex-col lg:flex-row ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
}

// 条件付きレンダリングのProps
interface ConditionalRenderProps {
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
  fallback?: ReactNode;
}

// 条件付きレンダリング - 画面サイズに応じてコンテンツを切り替え
export function ConditionalRender({ 
  mobile, 
  tablet, 
  desktop, 
  fallback 
}: ConditionalRenderProps) {
  const screenSize = useScreenSize();

  switch (screenSize) {
    case 'mobile':
      return <>{mobile || fallback}</>;
    case 'tablet':
      return <>{tablet || fallback}</>;
    case 'desktop':
      return <>{desktop || fallback}</>;
    default:
      return <>{fallback}</>;
  }
}

// レスポンシブテキストのProps
interface ResponsiveTextProps {
  children: ReactNode;
  size?: {
    mobile?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    tablet?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    desktop?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

// レスポンシブテキスト
export function ResponsiveText({ 
  children, 
  size = { mobile: 'sm', tablet: 'base', desktop: 'lg' },
  weight = 'normal',
  className = ''
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const responsiveClasses = [
    sizeClasses[size.mobile || 'sm'],
    size.tablet ? `md:${sizeClasses[size.tablet]}` : '',
    size.desktop ? `lg:${sizeClasses[size.desktop]}` : '',
    weightClasses[weight],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={responsiveClasses}>
      {children}
    </span>
  );
}

// レスポンシブカードのProps
interface ResponsiveCardProps {
  children: ReactNode;
  padding?: {
    mobile?: 'sm' | 'md' | 'lg';
    tablet?: 'sm' | 'md' | 'lg';
    desktop?: 'sm' | 'md' | 'lg';
  };
  className?: string;
}

// レスポンシブカード
export function ResponsiveCard({ 
  children, 
  padding = { mobile: 'sm', tablet: 'md', desktop: 'lg' },
  className = ''
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const responsiveClasses = [
    'bg-white rounded-lg shadow-sm border',
    paddingClasses[padding.mobile || 'sm'],
    padding.tablet ? `md:${paddingClasses[padding.tablet]}` : '',
    padding.desktop ? `lg:${paddingClasses[padding.desktop]}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={responsiveClasses}>
      {children}
    </div>
  );
}