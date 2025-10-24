# RiftRewind Frontend

React & Next.js frontend for RiftRewind - A League of Legends match history and replay viewer.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

- React 19
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Turbopack (for faster builds)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your configuration:
   ```
   NEXT_PUBLIC_RIOT_API_KEY=your-riot-games-api-key
   NEXT_PUBLIC_RIOT_API_BASE_URL=https://developer.riotgames.com/apis
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
Frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── public/                # Static assets
├── .env.local            # Environment variables (not committed)
├── .env.example          # Environment variables template
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_RIOT_API_KEY` | Riot Games API key | - |
| `NEXT_PUBLIC_RIOT_API_BASE_URL` | Riot Games API documentation URL | https://developer.riotgames.com/apis |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | http://localhost:5000 |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Riot Games API Integration

The Riot Games API key is configured in `.env.local` and can be accessed in your components:

```typescript
const apiKey = process.env.NEXT_PUBLIC_RIOT_API_KEY;
```

For more information, visit: https://developer.riotgames.com/apis

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Styling

This project uses Tailwind CSS for styling. Customize the theme in `tailwind.config.ts`.

## TypeScript

This project uses TypeScript for type safety. Type definitions are in:
- `@types/node` - Node.js types
- `@types/react` - React types
- `@types/react-dom` - React DOM types

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Other Platforms

You can also deploy to:
- Netlify
- AWS Amplify
- Azure Static Web Apps
- Google Cloud Run

## License

MIT
