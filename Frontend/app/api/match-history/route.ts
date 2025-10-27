import { NextRequest, NextResponse } from 'next/server';

const API_KEY = "RGAPI-61e4f1c7-f5d9-4cd9-a285-0e84b66428f6";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const puuid = searchParams.get('puuid');
  
  if (!puuid) {
    return NextResponse.json({ error: 'PUUID is required' }, { status: 400 });
  }

  try {
    // Fetch match IDs by PUUID
    const matchIdsUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${API_KEY}`;
    const matchIdsResponse = await fetch(matchIdsUrl);
    
    if (!matchIdsResponse.ok) {
      throw new Error(`Failed to fetch match IDs: ${matchIdsResponse.status}`);
    }
    
    const matchIds: string[] = await matchIdsResponse.json();
    
    // Fetch all matches in parallel
    const matchPromises = matchIds.map(matchId => 
      fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`)
        .then(res => res.json())
        .catch(err => {
          console.error(`Failed to fetch match ${matchId}:`, err);
          return null;
        })
    );
    
    const matches = await Promise.all(matchPromises);
    
    // Filter out null results
    const validMatches = matches.filter(match => match !== null);
    
    return NextResponse.json(validMatches);
  } catch (error) {
    console.error('Error fetching match history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match history' },
      { status: 500 }
    );
  }
}

