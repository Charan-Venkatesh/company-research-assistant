# Dossier — AI Company Research Assistant

An AI-powered company research tool: give it a company name or a website URL,
and it resolves the official site, crawls it, enriches the findings with live
web search, runs AI analysis, maps competitors, and produces a downloadable
PDF report — all through a chat-style interface.

Built for the Relu Consultancy "AI & Automation Developer" hackathon brief.

## How it works

```
User input (name or URL)
        │
        ▼
 1. Resolve  ──  Serper.dev search if a name was given, to find the
        │        official website (knowledge graph → organic fallback)
        ▼
 2. Search + Crawl (parallel)
        │  ├─ Serper.dev: company overview + contact snippets
        │  └─ Crawler: fetches home page, discovers on-domain links to
        │     about/products/services/solutions/contact/pricing pages,
        │     skips logins/carts/duplicates/off-domain links, extracts
        │     visible text with Cheerio
        ▼
 3. Analyze  ──  OpenRouter (user-selected model) turns crawled text +
        │        search snippets into a structured JSON profile: summary,
        │        products/services, AI-generated pain points, industry
        ▼
 4. Competitors ── Serper.dev searches "<company> competitors <industry>",
        │          OpenRouter turns the raw snippets into a clean,
        │          deduplicated shortlist with name/website/reason
        ▼
 5. Report  ──  Streamed back to the UI over Server-Sent Events (live
                progress log), rendered as a "Dossier" panel, downloadable
                as a PDF (pdfkit), optionally posted to Discord
```

Everything runs statelessly, request-by-request — there's no database, per
the assignment's constraints. Discord settings and applicant details live in
the browser's `localStorage` only.

## Tech stack

- **Next.js 15 (App Router) + TypeScript** — single deployable project (UI +
  API routes together), matches the "single unified project" requirement and
  deploys cleanly to Vercel.
- **Tailwind CSS v4** — styling.
- **Cheerio** — lightweight HTML parsing for the crawler (fast, works fine in
  serverless functions; see *Known limitations* below for the trade-off).
- **pdfkit** — server-side PDF generation, streamed back as a download.
- **Serper.dev** — search integration (official site resolution, company
  facts, competitor discovery).
- **OpenRouter** — AI analysis, with a live model-selection dropdown.
- **Discord REST API** — bonus integration, posts the PDF + applicant/company
  details to a channel via bot token.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your keys, see below
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable             | Required | Description                                                                 |
|-----------------------|:--------:|-------------------------------------------------------------------------------|
| `SERPER_API_KEY`      | Yes      | From [serper.dev](https://serper.dev). Used for search/resolution/competitors. |
| `OPENROUTER_API_KEY`  | Yes      | From [openrouter.ai/keys](https://openrouter.ai/keys). Used for all AI calls. |
| `APP_URL`              | No       | Public URL of your deployment, sent as `HTTP-Referer` to OpenRouter.         |

Discord Bot Token and Channel ID are **not** environment variables — they're
entered per-user on the `/settings` page and stored in `localStorage`, since
the evaluator supplies their own bot token/channel at review time and the
brief rules out a database.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel → it auto-detects Next.js.
3. Add `SERPER_API_KEY` and `OPENROUTER_API_KEY` under Project → Settings →
   Environment Variables.
4. Deploy. That's it — API routes, crawler, and PDF generation all run as
   Vercel serverless functions (`runtime = "nodejs"` is set explicitly on
   every route since `pdfkit`/`cheerio` need the Node runtime, not Edge).

Netlify or Cloudflare Pages work too, as long as the platform runs the API
routes on a Node.js runtime (not an edge/worker runtime), since `pdfkit`
needs Node's `fs`.

## Project structure

```
app/
  page.tsx                 chat-style research console
  settings/page.tsx         Discord + applicant config (bonus)
  api/research/route.ts     orchestrates the pipeline, streams progress (SSE)
  api/pdf/route.ts          generates and returns the PDF report
  api/discord/route.ts      posts the report to a Discord channel (bonus)
  api/models/route.ts       live OpenRouter model list for the dropdown
lib/
  serper.ts                 Serper.dev search integration
  crawler.ts                 website crawler (page discovery + extraction)
  openrouter.ts              AI analysis + competitor reasoning + model list
  pdfGenerator.ts             PDF report layout (pdfkit)
  discord.ts                  Discord bot REST call (multipart file upload)
  pipeline.ts                  orchestrates steps 1-4 above, emits progress
  clientConfig.ts              localStorage helpers (Discord/applicant info)
components/
  ResearchConsole.tsx        chat UI, SSE stream consumer
  Dossier.tsx                 report display + PDF/Discord actions
  ProgressLog.tsx              case-log style progress indicator
  ModelSelect.tsx               model dropdown
  TopNav.tsx                    nav bar
```

## Design notes

The UI leans into the "research dossier" framing rather than a generic
chat skin: a dark "case log" console on the left where each pipeline step
reports in as it completes, and a manila-paper "Dossier" panel on the right
that assembles the structured report, stamped "REPORT COMPLETE" on
completion. Monospace type is used specifically for data (URLs, phone
numbers, model IDs) to visually separate facts from prose.

## Known limitations / possible next steps

- **Crawling is HTML-only** (Cheerio + `fetch`, no headless browser). This
  keeps it fast and cheap to run on serverless functions, but it won't
  render client-side (JS-heavy SPA) marketing sites. A natural upgrade is a
  Playwright-based crawler behind a feature flag for sites that need it.
- **Phone/address extraction** uses a regex + a best-effort CSS selector
  guess, backed up by the AI pass and Serper's knowledge graph. It's
  intentionally conservative — it prefers `null` over a hallucinated value.
- **No caching layer.** Since the brief rules out a database, repeated
  research on the same company re-runs the full pipeline. Adding a
  short-TTL cache (e.g. Vercel KV) would cut latency/cost on repeat lookups
  without violating the "no permanent database" constraint.
- **Competitor identification** is search-driven, so quality depends on how
  well-indexed the company/industry is; niche or very new companies will
  return thinner competitor sets.

## FAQ (from the brief)

- **Any AI model?** Yes — the dropdown is populated live from OpenRouter's
  `/models` endpoint, with a small curated fallback list if that call fails.
- **Any framework/language?** This submission uses Next.js/TypeScript.
- **Database?** None used; no persistent storage anywhere.
- **Auth?** None — matches the "no authentication required" requirement.
