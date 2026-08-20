# SwipeX — Intelligent Job Discovery & Career Assistance Platform

A Vite + React prototype based on the supplied SwipeX project specification.

## Included modules
- Demo authentication and role selection
- Swipe-based job discovery
- Job search and smart filters
- Save/apply/skip workflow
- Resume text analysis and ATS scoring
- Skill-gap and keyword suggestions
- Personalized recommendations
- Application tracking
- Notifications
- Startup discovery
- Dashboard analytics
- Responsive UI suitable for Vercel

## Run in VS Code

1. Extract the ZIP.
2. Open the extracted `swipex-project` folder in VS Code.
3. Open Terminal.
4. Run:

```bash
npm install
npm run dev
```

5. Open the localhost URL shown by Vite.

## Build

```bash
npm run build
```

## Deploy to Vercel

Import the project folder/repository into Vercel. Vercel detects Vite automatically.

Build command:
`npm run build`

Output directory:
`dist`

## Important
This is a working frontend demonstration/prototype. Authentication, AI analysis, recommendations and analytics use browser/localStorage demo logic so the project can run immediately without API keys or a database. Production JWT/OAuth, PostgreSQL, OpenAI/spaCy/sentence-transformers, real job APIs and server-side security can be connected later according to the full specification.
