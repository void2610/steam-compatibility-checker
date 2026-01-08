import { NextRequest, NextResponse } from 'next/server';
import { SteamApiService } from '@/services/steam-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vanityUrl = searchParams.get('vanityurl');
    const urlType = parseInt(searchParams.get('url_type') || '1');

    if (!vanityUrl) {
      return NextResponse.json(
        { error: 'Vanity URL is required' },
        { status: 400 }
      );
    }

    // サーバーサイドでSteam APIを呼び出し
    const steamApiService = new SteamApiService(process.env.NEXT_PUBLIC_STEAM_API_KEY);
    const steamId = await steamApiService.resolveVanityUrl(vanityUrl, urlType);

    return NextResponse.json({ steamid: steamId });
  } catch (error) {
    console.error('Steam API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}