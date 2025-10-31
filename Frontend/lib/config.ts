// Riot Games API Configuration
export const RIOT_API_CONFIG = {
  API_KEY: "RGAPI-172b2b63-7a06-41e7-bbd0-30a62ab70fe4", // Using the key from rewind page
  PLATFORM: "eun1", // EUNE server
  REGION: "europe", // Europe region for API calls
} as const;

// Lambda API Configuration
export const LAMBDA_CONFIG = {
  AI_ANALYSIS_URL: "https://or0v98ycwe.execute-api.us-east-1.amazonaws.com/prod/league-ai-analytics-data-ingest",
} as const;
