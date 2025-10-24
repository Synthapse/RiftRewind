import requests

# Your Riot Developer API key
API_KEY = "RGAPI-5a997298-b608-4b88-b39d-1f1998124510"

# Platform / region
platform = "eun1"  # EUNE server

# Champion rotations endpoint
url = f"https://{platform}.api.riotgames.com/lol/platform/v3/champion-rotations"

# Headers
headers = {
    "X-Riot-Token": API_KEY
}

# Send GET request
response = requests.get(url, headers=headers)

# Handle response
if response.status_code == 200:
    data = response.json()
    print("Free Champion Rotation:")
    print("Free Champions for All Players:", data.get("freeChampionIds", []))
    print("Free Champions for New Players (Level 10 or less):", data.get("freeChampionIdsForNewPlayers", []))
elif response.status_code == 403:
    print("Forbidden: Check if your API key is valid or expired.")
else:
    print(f"Error {response.status_code}: {response.text}")
