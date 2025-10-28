# API Configuration

## Centralized Configuration

All API keys and endpoints are now centralized in `lib/config.ts` for easier management and consistency across the application.

## Current Configuration

### Riot Games API
- **API Key**: Currently hardcoded in `lib/config.ts`
- **Platform**: EUN1 (EUNE server)
- **Region**: Europe

### Lambda AI Analysis
- **Endpoint**: Configured in `lib/config.ts`

## Environment Variables (Future Implementation)

To use environment variables instead of hardcoded values, you can:

1. Create a `.env.local` file in the Frontend directory
2. Add your API keys:
   ```
   RIOT_API_KEY=your_riot_api_key_here
   RIOT_PLATFORM=eun1
   RIOT_REGION=europe
   LAMBDA_AI_ANALYSIS_URL=your_lambda_url_here
   ```

3. Update `lib/config.ts` to use environment variables:
   ```typescript
   export const RIOT_API_CONFIG = {
     API_KEY: process.env.RIOT_API_KEY || "fallback_key",
     PLATFORM: process.env.RIOT_PLATFORM || "eun1",
     REGION: process.env.RIOT_REGION || "europe",
   } as const;
   ```

## Files Using Configuration

- `components/ChampionList.tsx` - Match data fetching and AI analysis
- `app/match/[matchId]/rewind/page.tsx` - Rewind page data fetching

## Security Note

The `.gitignore` file excludes `.env*` files to prevent accidentally committing API keys to version control.
