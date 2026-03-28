# template-nextjs-orchestrator-js

A business orchestration template built with Next.js, NextAuth (Google OAuth), shadcn/ui, and ChatBotKit. Create companies, deploy AI agents with pre-configured tools (file read/write, shell/bash, shared workspace), and assign tasks.

## Features

- **Google OAuth** via NextAuth for authentication
- **Companies** (backed by ChatBotKit Blueprints) as organizational workspaces
- **Agents** (backed by ChatBotKit Bots) with editable names and backstories
- **Pre-configured Tools** per company: file read/write, shell execution, shared space storage
- **Chat** directly with any agent through a streaming conversation UI
- **Tasks** - assign one-off tasks to agents and see streaming results
- **shadcn/ui** components with Tailwind CSS

## Getting Started

1. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable                | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `CHATBOTKIT_API_SECRET` | ChatBotKit API token from https://chatbotkit.com/tokens |
| `NEXTAUTH_SECRET`       | Random secret for NextAuth JWT encryption               |
| `NEXTAUTH_URL`          | Your app URL (e.g. `http://localhost:3000`)              |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID                                  |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret                              |

## Architecture

```
/auth/signin     - Google OAuth sign-in page
/agents          - Company + agent management dashboard
/agents/[id]     - Agent detail with chat and settings tabs
/tasks           - Task assignment and execution
```

### How It Works

1. User signs in with Google
2. User creates a **Company** (ChatBotKit Blueprint) with shared tools:
   - File read/write ability
   - Shell/bash execution ability
   - Shared space storage ability
3. Inside a company, user creates **Agents** (ChatBotKit Bots) with custom names and backstories
4. User can **chat** with agents directly or **assign tasks** for one-off execution
5. All agents in a company share the same toolset through a connected Skillset
