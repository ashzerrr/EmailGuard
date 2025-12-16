# Developer Manual - EmailGuard

## Overview
EmailGuard is a Node.js + Express web app that checks email reputation using EmailRep and stores lookup history in Supabase.

## Local Setup
1. Clone repository
2. Install dependencies:
   - `npm install`
3. Create `.env` in the project root:
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
4. Start server:
   - `npm run dev`
5. Open:
   - `http://localhost:3000`

## Supabase
Create table `email_lookups` (see SQL in README or project setup docs).
RLS policies must allow SELECT and INSERT.

## API Endpoints
### POST /api/check-email
Checks an email using EmailRep and returns a normalized response:
- `email`, `reputation`, `suspicious`, `references`, and `details` flags.

### POST /api/lookups
Writes a lookup result to Supabase.

### GET /api/lookups?limit=10
Returns recent lookup history from Supabase.

### GET /api/stats
Returns aggregated counts for charts (reputation distribution + suspicious yes/no).

## Tests
No automated tests currently implemented.

## Known Issues
- EmailRep may return HTTP 429 (rate-limits). The UI displays an error message when this occurs.

## Roadmap
- Add user accounts and saved reports
- Add caching to reduce EmailRep calls
- Add more visualizations (time trends, domain-based analysis)
