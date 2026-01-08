# DualUserInterface コンポーネント

Steam相性診断アプリケーション用の左右対称UIコンポーネント群です。

## 概要

DualUserInterfaceは、2人のSteamユーザーを対等に比較表示するための左右対称レイアウトを提供します。要件1.5「自分と相手を同列に扱うUI設計」と要件3.5「両ユーザーが対等に表示される」を満たすために設計されています。

## 主要コンポーネント

### 1. UserComparisonCard
個別ユーザーの情報を表示するカードコンポーネント

```tsx
<UserComparisonCard
  user={steamUser}
  library={gameLibrary}
  position="left" // または "right"
  isCurrentUser={true}
/>
```

**特徴:**
- ユーザープロフィール情報（アバター、名前、Steam ID）
- ゲーム統計（総ゲーム数、総プレイ時間）
- トップゲーム一覧（プレイ時間順）
- 左右の位置に応じた適切なレイアウト

### 2. CentralResultsPanel
相性分析結果を中央に表示するパネル

```tsx
<CentralResultsPanel
  result={compatibilityResult}
  loading={false}
  error={undefined}
/>
```

**特徴:**
- 相性スコアの大きな表示
- 統計サマリー（共通ゲーム、Co-op提案、共通ジャンル）
- 詳細結果（共通ゲーム一覧、Co-op提案、ジャンル相性）
- ローディング・エラー状態の適切な表示

### 3. CompatibilityResultsLayout
3カラムレイアウトの基盤コンポーネント

```tsx
<CompatibilityResultsLayout
  leftUser={user1}
  leftLibrary={library1}
  rightUser={user2}
  rightLibrary={library2}
  result={compatibilityResult}
  currentUserSteamId={currentUser.steamId}
/>
```

**特徴:**
- デスクトップ: 3カラムレイアウト（左：ユーザー1、中央：結果、右：ユーザー2）
- モバイル: 縦積みレイアウト（ユーザー1 → 結果 → ユーザー2）
- レスポンシブ対応

### 4. DualUserSetup
初期設定用の左右対称UI

```tsx
<DualUserSetup
  currentUser={currentUser}
  currentLibrary={currentLibrary}
  onCompatibilityResult={handleResult}
  onError={handleError}
/>
```

**特徴:**
- 現在のユーザーを左側に表示
- 中央に相性診断フォームを配置
- 右側は空の状態（診断対象待ち）

### 5. DualUserInterface
完全な相性診断結果表示UI

```tsx
<DualUserInterface
  currentUser={currentUser}
  currentLibrary={currentLibrary}
  targetUser={targetUser}
  targetLibrary={targetLibrary}
  compatibilityResult={result}
  onNewDiagnosis={startNewDiagnosis}
/>
```

**特徴:**
- 完全な左右対称レイアウト
- 両ユーザーの詳細情報表示
- 中央に相性分析結果
- 新しい診断開始機能

## レスポンシブ対応

### デスクトップ（1024px以上）
```
┌─────────────┬─────────────┬─────────────┐
│   ユーザー1   │   相性結果    │   ユーザー2   │
│             │             │             │
│ ・プロフィール │ ・相性スコア   │ ・プロフィール │
│ ・ゲーム統計  │ ・共通ゲーム   │ ・ゲーム統計  │
│ ・トップゲーム │ ・Co-op提案   │ ・トップゲーム │
└─────────────┴─────────────┴─────────────┘
```

### タブレット（768px-1023px）
```
┌─────────────┬─────────────┬─────────────┐
│   ユーザー1   │   相性結果    │   ユーザー2   │
│             │             │             │
│（縮小表示）   │（縮小表示）   │（縮小表示）   │
└─────────────┴─────────────┴─────────────┘
```

### モバイル（767px以下）
```
┌─────────────────────────────────────────┐
│              ユーザー1                    │
│                                         │
│        ・プロフィール                     │
│        ・ゲーム統計                      │
│        ・トップゲーム                     │
├─────────────────────────────────────────┤
│              相性結果                     │
│                                         │
│        ・相性スコア                      │
│        ・共通ゲーム                      │
│        ・Co-op提案                      │
├─────────────────────────────────────────┤
│              ユーザー2                    │
│                                         │
│        ・プロフィール                     │
│        ・ゲーム統計                      │
│        ・トップゲーム                     │
└─────────────────────────────────────────┘
```

## 使用例

### 基本的な使用方法

```tsx
import { DualUserInterface } from '@/components';

function CompatibilityPage() {
  const { user } = useSteamAuth();
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [targetUser, setTargetUser] = useState<SteamUser | null>(null);

  return (
    <DualUserInterface
      currentUser={user}
      currentLibrary={currentLibrary}
      targetUser={targetUser}
      targetLibrary={targetLibrary}
      compatibilityResult={result}
      onNewDiagnosis={() => {
        setResult(null);
        setTargetUser(null);
      }}
    />
  );
}
```

### カスタムレイアウト

```tsx
import { CompatibilityResultsLayout, UserComparisonCard, CentralResultsPanel } from '@/components';

function CustomLayout() {
  return (
    <CompatibilityResultsLayout
      leftUser={user1}
      rightUser={user2}
      result={result}
    >
      {/* 中央パネルに追加コンテンツ */}
      <div className="mt-4">
        <button onClick={shareResult}>結果をシェア</button>
      </div>
    </CompatibilityResultsLayout>
  );
}
```

## 設計原則

### 1. 対等性（Equality）
- 左右のユーザーを同じ重要度で表示
- 同じ情報量と視覚的重みを提供
- 「あなた」と「相手」の区別を最小限に

### 2. 対称性（Symmetry）
- 左右対称なレイアウト設計
- 一貫したコンポーネント構造
- バランスの取れた視覚的配置

### 3. レスポンシブ性（Responsiveness）
- 画面サイズに応じた適切なレイアウト調整
- モバイルファーストの設計思想
- タッチ操作に適したUI要素

### 4. 拡張性（Extensibility）
- コンポーネントの組み合わせによる柔軟な構成
- カスタムコンテンツの挿入ポイント
- 将来的な機能追加への対応

## 技術仕様

### 依存関係
- React 18+
- TypeScript
- Tailwind CSS
- Steam API型定義

### パフォーマンス
- 軽量なコンポーネント設計
- 必要最小限のレンダリング
- メモ化による最適化

### アクセシビリティ
- セマンティックなHTML構造
- 適切なARIAラベル
- キーボードナビゲーション対応
- スクリーンリーダー対応

## 今後の拡張予定

1. **アニメーション効果**
   - 相性スコアのカウントアップアニメーション
   - レイアウト切り替え時のスムーズな遷移

2. **カスタマイズ機能**
   - テーマカラーの変更
   - 表示項目の選択

3. **インタラクション強化**
   - ドラッグ&ドロップによるユーザー配置
   - ホバー効果による詳細情報表示

4. **データ可視化**
   - チャートによるジャンル相性表示
   - プレイ時間の視覚的比較