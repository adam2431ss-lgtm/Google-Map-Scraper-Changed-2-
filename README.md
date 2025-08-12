# Cloud Run Google Maps Scraper (Puppeteer)

## What this package contains
- `server.js` - Express API exposing `/scrape?query=...` returning JSON
- `Dockerfile` - builds a container with Node 20 and Chromium
- `cloudbuild.yaml` - optional build & deploy using Cloud Build
- `package.json` - dependencies

## Quick deploy to Cloud Run (recommended)
1. Upload this repo to GitHub.
2. In Google Cloud Console -> Cloud Run -> Create Service -> Deploy from source.
   - Select the repo and branch.
   - Cloud Build will build the container using the included Dockerfile.
   - Set **Allow unauthenticated invocations** if you want public access.
3. After deploy, call the endpoint:
   `GET https://<SERVICE_URL>/scrape?query=pizza+in+new+york&limit=20`

## Deploy via Cloud Build (gcloud)
From Cloud Shell or gcloud installed locally:
```bash
gcloud builds submit --config cloudbuild.yaml .
```

## Notes about keep-alive / pinging
- Cloud Run scales to zero when idle. Use Cloud Scheduler (HTTP) to ping the service every 5-10 minutes to reduce cold starts.
- This repo supports an optional environment variable `SELF_PING_URL` and `SELF_PING_INTERVAL_MS` to make the service ping itself. However Cloud Run instances are ephemeral — for reliable scheduling use Cloud Scheduler.

## Costs
- Your $300 free credit can run many scraping jobs but be mindful: Puppeteer runs use CPU time and can charge. Test with small jobs first.
