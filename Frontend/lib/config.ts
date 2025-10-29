// Riot Games API Configuration
export const RIOT_API_CONFIG = {
  API_KEY: "RGAPI-002ad03b-9c2e-42ee-89b5-f6cf13d50fd2", // Using the key from rewind page
  PLATFORM: "eun1", // EUNE server
  REGION: "europe", // Europe region for API calls
} as const;

// Lambda API Configuration
export const LAMBDA_CONFIG = {
  AI_ANALYSIS_URL: "https://or0v98ycwe.execute-api.us-east-1.amazonaws.com/prod/league-ai-analytics-data-ingest",
} as const;
