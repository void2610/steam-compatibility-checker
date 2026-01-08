import { NextRequest, NextResponse } from 'next/server';
import { SteamApiService } from '@/services/steam-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steamid');
    const includeAppInfo = searchParams.get('include_appinfo') === '1';
    const includePlayedFreeGames = searchParams.get('include_played_free_games') === '1';

    if (!steamId) {
      return NextResponse.json(
        { error: 'Steam ID is required' },
        { status: 400 }
      );
    }

    // サーバーサイドでSteam APIを呼び出し
    const steamApiService = new SteamApiService(process.env.NEXT_PUBLIC_STEAM_API_KEY);
    const library = await steamApiService.getOwnedGames(steamId, includeAppInfo, includePlayedFreeGames);

    return NextResponse.json(library);
  } catch (error) {
    console.error('Steam API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}