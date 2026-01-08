import { LoginButton } from "@/components/LoginButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Steam相性診断
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Steamユーザー同士のゲーミング相性を分析するWebアプリケーション
          </p>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Steam相性診断とは？
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
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
          </div>
        </main>
      </div>
    </div>
  );
}
