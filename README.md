# LegoEater

Family LEGO inventory app with:
- Bun + Hono API
- React + Vite web UI
- SQLite storage
- CLI (`lego`) commands

## Prerequisites

- macOS or Linux
- Node.js (optional, but useful for tooling)
- Bun 1.3+

## Install Bun

If Bun is not installed:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc
bun --version
```

## Project Setup

From the repo root:

```bash
cd /Users/jay/lego
cp .env.example .env
```

Update `.env` with your API keys as needed:
- `REBRICKABLE_API_KEY`
- `BRICKLINK_CONSUMER_KEY`
- `BRICKLINK_CONSUMER_SECRET`
- `BRICKLINK_TOKEN_VALUE`
- `BRICKLINK_TOKEN_SECRET`
- `UPCITEMDB_KEY`

Install dependencies:

```bash
bun install
```

## Run in Development

Run API and web app together:

```bash
bun run dev
```

Default URLs:
- API: `http://localhost:3000`
- Web: `http://localhost:5173`

Health check:

```bash
curl http://localhost:3000/api/health
```

## Build and Start (Production Mode)

Build web assets:

```bash
bun run build
```

Start API in production mode (serves API + built web files):

```bash
bun run start
```

## CLI Usage

Run CLI directly through workspace script:

```bash
bun run cli -- --help
```

Link global command:

```bash
bun run cli:link
lego --help
```

Examples:

```bash
lego search "Millennium Falcon"
lego info 75192
lego add 75192 --owner Jay --condition new_sealed --quantity 1
lego list --sort value
lego update-prices
lego report summary
```

## Nightly Price Updates

Manual run:

```bash
bun run scripts/nightly-prices.ts
```

Launchd template:
- `/Users/jay/lego/scripts/launchd/com.legoeater.nightly-prices.plist`

## Useful Paths

- API: `/Users/jay/lego/packages/api`
- Web: `/Users/jay/lego/packages/web`
- CLI: `/Users/jay/lego/packages/cli`
- Shared types: `/Users/jay/lego/packages/shared`
- Price script: `/Users/jay/lego/scripts/nightly-prices.ts`
