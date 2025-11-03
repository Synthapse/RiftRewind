import { NextRequest, NextResponse } from 'next/server';
import { RIOT_API_CONFIG } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params;
    
    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const API_KEY = RIOT_API_CONFIG.API_KEY;
    const matchUrl = `https://${RIOT_API_CONFIG.REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`;
    
    const response = await fetch(matchUrl);
    
    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json({ error: 'Forbidden: Check if your API key is valid or expired.' }, { status: 403 });
      } else if (response.status === 404) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      return NextResponse.json({ error: `Riot API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching match data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch match data' },
      { status: 500 }
    );
  }
}

