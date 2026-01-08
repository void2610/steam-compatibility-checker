import { NextRequest, NextResponse } from 'next/server';
import { SteamApiService } from '@/services/steam-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steamIds = searchParams.get('steamids');

    if (!steamIds) {
      return NextResponse.json(
        { error: 'Steam IDs are required' },
        { status: 400 }
      );
    }

    const steamIdArray = steamIds.split(',');

    // サーバーサイドでSteam APIを呼び出し
    const steamApiService = new SteamApiService(process.env.NEXT_PUBLIC_STEAM_API_KEY);
    const players = await steamApiService.getPlayerSummaries(steamIdArray);

    return NextResponse.json(players);
  } catch (error) {
    console.error('Steam API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}