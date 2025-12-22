# Developer Manual – EmailGuard

## Overview
EmailGuard is a web application that checks the reputation of email addresses using the EmailRep API and stores lookup history in Supabase. The application uses static frontend pages and Vercel Serverless Functions for backend APIs to ensure consistent behavior in both local development and production.

---

## Project Architecture
- Frontend: Static HTML, CSS, and JavaScript served from the `/public` directory
- Backend APIs: Vercel Serverless Functions located in the `/api` directory
- Database: Supabase (PostgreSQL)
- External API: EmailRep

---

## Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm
- Vercel CLI

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ashzerrr/EmailGuard.git
   cd EmailGuard

### install dependencies
npm install

### install vercel CLI
npm install -g vercel

### create .env file in the project root with the following variables: 

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_public_key
EMAILREP_API_KEY=your_emailrep_api_key

### Running the app locally
vercel dev

### Open app in your browser
https://localhost:3000

### Production development
The project is deployed on Vercel.
Deployment steps:
- Push code changes to the main branch on GitHub
- Vercel automatically builds and deploys the project
- Environment variables must be configured in the Vercel Dashboard under:
  Project Settings → Environment Variables

### Supabase Setup
- Create a table named email_lookups with the following columns:
  id (uuid, primary key)
  email (text)
  reputation (text)
  suspicious (boolean)
  reference_count (integer)
  data_breach (boolean)
  credentials_leaked (boolean)
  spam (boolean)
  disposable (boolean)
  checked_at (timestamp, default now)
- RLS must be disabled

### API Endpoints
- POST /api/check-email
  Calls the EmailRep API to analyze an email address
  Stores the result in Supabase
  Returns the full EmailRep response
  Request body:
{
  "email": "example@email.com"
}
- GET /api/lookups
  Returns the 10 most recent email lookups from Supabase
  Used to populate the “Recent Email Lookups” section on the Home page

- GET /api/stats
  Returns aggregated lookup statistics:
  Reputation distribution
  Suspicious vs non-suspicious counts
  Used to populate the Chart.js visualization on the Home page

### Tests
  No automated tests are currently implemented. Manual testing is performed using the browser interface and API responses.

- Known Issues & Limitations
EmailRep enforces rate limits; excessive requests may result in HTTP 429 errors.
Free-tier Supabase projects may experience cold starts after inactivity.