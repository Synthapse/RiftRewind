import { NextRequest, NextResponse } from 'next/server';
import { RIOT_API_CONFIG } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const puuid = searchParams.get('puuid');
    const count = parseInt(searchParams.get('count') || '5', 10);
    const start = parseInt(searchParams.get('start') || '0', 10);

    if (!puuid) {
      return NextResponse.json({ error: 'PUUID is required' }, { status: 400 });
    }

    const API_KEY = RIOT_API_CONFIG.API_KEY;
    const matchIdsUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}&api_key=${API_KEY}`;
    
    const response = await fetch(matchIdsUrl);
    
    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json({ error: 'Forbidden: Check if your API key is valid or expired.' }, { status: 403 });
      } else if (response.status === 404) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json({ error: `Riot API error: ${response.status}` }, { status: response.status });
    }

    const matchIds = await response.json();
    return NextResponse.json(matchIds);
  } catch (error) {
    console.error('Error fetching match history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch match history' },
      { status: 500 }
    );
  }
}

