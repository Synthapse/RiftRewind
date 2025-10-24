# RiftRewind

RiftRewind is a League of Legends match history and replay viewer application that integrates with the Riot Games API.

## Project Structure

```
RiftRewind/
├── Backend/          # .NET 9.0 Web API
├── Frontend/         # React & Next.js application
└── README.md
```

## Backend

The backend is built with .NET 9.0 and provides a Web API for interacting with the Riot Games API.

### Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend/RiftRewind.Api
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Build the project:
   ```bash
   dotnet build
   ```

4. Run the API:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:5001` (or `http://localhost:5000`).

### Configuration

The Riot Games API key is configured in `appsettings.json`:
- **ApiKey**: Your Riot Games API key
- **ApiBaseUrl**: Riot Games API documentation URL

## Frontend

The frontend is built with React and Next.js 16, using TypeScript and Tailwind CSS.

### Setup

1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the `NEXT_PUBLIC_RIOT_API_KEY` with your API key

4. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm start
```

## Riot Games API

This project integrates with the Riot Games API. For more information, visit:
https://developer.riotgames.com/apis

### API Key

The API key is included in both Backend and Frontend configurations:
- Backend: `Backend/RiftRewind.Api/appsettings.json`
- Frontend: `Frontend/.env.local`

**Note**: For production deployments, use environment variables or secure configuration management instead of hardcoding API keys.

## Technologies

### Backend
- .NET 9.0
- ASP.NET Core Web API
- OpenAPI/Swagger

### Frontend
- React 19
- Next.js 16
- TypeScript
- Tailwind CSS 4
- Turbopack

## Development

### Running Both Projects

1. Start the Backend:
   ```bash
   cd Backend/RiftRewind.Api
   dotnet run
   ```

2. Start the Frontend (in a new terminal):
   ```bash
   cd Frontend
   npm run dev
   ```

## License

This project is licensed under the MIT License.

