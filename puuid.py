import requests

# Your Riot Developer API key
API_KEY = "RGAPI-5a997298-b608-4b88-b39d-1f1998124510"

# Platform / region
platform = "eun1"  # EUNE server

# Match ID
match_id = "3849902044"

# Match endpoint
url = f"https://{platform}.api.riotgames.com/lol/match/v5/matches/{match_id}"

# Headers
headers = {
    "X-Riot-Token": API_KEY
}

# Send GET request
response = requests.get(url, headers=headers)

# Handle response
if response.status_code == 200:
    data = response.json()
    print("Match Data:")
    print(f"Match ID: {data.get('metadata', {}).get('matchId', 'N/A')}")
    print(f"Game Duration: {data.get('info', {}).get('gameDuration', 'N/A')} seconds")
    print(f"Game Mode: {data.get('info', {}).get('gameMode', 'N/A')}")
    print(f"Game Type: {data.get('info', {}).get('gameType', 'N/A')}")
    print(f"Map ID: {data.get('info', {}).get('mapId', 'N/A')}")
    print(f"Queue ID: {data.get('info', {}).get('queueId', 'N/A')}")
    print(f"Game Version: {data.get('info', {}).get('gameVersion', 'N/A')}")
    
    # Print participants
    participants = data.get('info', {}).get('participants', [])
    print(f"\nParticipants ({len(participants)}):")
    for i, participant in enumerate(participants, 1):
        print(f"  {i}. {participant.get('summonerName', 'Unknown')} - {participant.get('championName', 'Unknown')} (Level {participant.get('champLevel', 'N/A')})")
        print(f"     KDA: {participant.get('kills', 0)}/{participant.get('deaths', 0)}/{participant.get('assists', 0)}")
        print(f"     CS: {participant.get('totalMinionsKilled', 0)}")
        print(f"     Gold: {participant.get('goldEarned', 0)}")
        print(f"     Team: {participant.get('teamId', 'N/A')}")
        print()
        
elif response.status_code == 403:
    print("Forbidden: Check if your API key is valid or expired.")
elif response.status_code == 404:
    print("Match not found: The match ID might be invalid or from a different region.")
else:
    print(f"Error {response.status_code}: {response.text}")
