Tech choice (fast + clean, no React)

SvelteKit + TypeScript + Tailwind + SkeletonUI (or Flowbite-Svelte) + ApexCharts (svelte-apexcharts) + Drizzle ORM + SQLite

Why: SvelteKit gives you file-based routing, server endpoints (Node), great DX. SkeletonUI/Flowbite-Svelte gives you polished admin styles like Filament.

What you must ship (minimum that looks “production”)
A) Required API (Node/SvelteKit server routes)

GET /api/reviews/hostaway

Returns normalized reviews from your mock JSON (filters + pagination).

POST /api/reviews/selection

Body: { reviewId, selectedForWeb, note? }

Persists moderation toggle.

GET /api/listings/[id]/selected-reviews

For the public preview page.

(Nice, small) GET /api/reviews/stats

Precomputed KPIs and trends for “Overview” cards/charts.

These hit SQLite via Drizzle. Mock JSON is seeded once via a script or a /settings upload action.

B) Pages (routes), their components, and how they connect
1) /dashboard (Manager Overview – entry point)

Goal: quick health view + navigate to reviews or a property.

Components

KpiCards: Avg rating (overall & last 30d), #reviews, %5★, channel mix

TrendLineChart: rating over time (by week)

CategoryHeatmap (optional): avg per category by listing

TopListingsTable (mini): top 5 by avg rating; clicking a row → /listings/[id]

Data

from GET /api/reviews/stats

Primary actions

“Go to Reviews” button → /reviews

Click a listing → /listings/[id]

Relationship: Overview is the “home”. You won’t moderate here; it’s for orientation and discovery.

2) /reviews (Manager Reviews – where moderation happens)

Goal: filter, inspect, approve/unapprove for website.

Layout: Left filters panel + main table

Components

FiltersBar (collapsible left drawer)

Listing (select)

Date range (presets: 7/30/90 days, custom)

Channel (Airbnb/Booking/Direct/Google)

Type (guest→host / host→guest)

Min rating (slider)

“Selected only” (toggle)

ReviewsTable (virtualized TanStack-like for Svelte; or basic table)

Columns: Date, Listing, Channel, Type, Overall, Category badges, Snippet, Selected toggle, Actions

Row action: “View” → /reviews/[id]

BulkBar (optional): select many rows → bulk approve/unapprove

Toast for success/error

Data

from GET /api/reviews/hostaway (with query params for filters + pagination)

toggles call POST /api/reviews/selection

Primary actions

Approve for web (row toggle)

Drill into a single review or a listing

Relationship: This is the core “workbench”. From here you jump to review details or a listing drill-down.

3) /reviews/[id] (Review Moderation – single review)

Goal: deeply read, tag, approve.

Components

ReviewHeader: listing, channel, date, guest name

RatingsStrip: overall + category chips

BodyCard: publicReview text

ModerationPanel: Selected for Web toggle, note, tags

PrevNextNav: go to previous/next based on current filters (store last filter state in query)

Data

a single review from DB (or filtered fetch then find)

toggle via POST /api/reviews/selection

Primary actions

Approve/unapprove, set note, set tags (tags optional; store in JSON column)

Relationship: Entered from /reviews table. Next/Prev returns to same filter context.

4) /listings (optional small list) and /listings/[id] (Property Drill-down)

Goal: per-property performance + scoped moderation list.

Components

ListingHeader: name, avg, count, channel pie, last-30d delta

CategoryCards: cleanliness, communication, etc. (avg badges)

TrendLineChart (scoped to listing)

ReviewsTable (scoped to listing, same columns & toggles)

Button: Preview public page → /preview/[slug]?key=...

Data

stats from /api/reviews/stats?listingId=...

reviews from /api/reviews/hostaway?listingId=...

Primary actions

Moderate in context of one listing

Click Preview

Relationship: You can arrive here from Overview or Reviews table. It’s the “zoom-in” view.

5) /preview/[slug] (Public-style property page)

Goal: mimic Flex Living layout, shows only approved reviews.

Components

PropertyHero (stubbed pic & address to match style)

ReviewCards (approved only): rating, chips, date, guest first name + initial, channel icon

Data

GET /api/listings/[id]/selected-reviews (or slug → id)

Security

Token in query (?key=...) or signed URL check; or skip if they don’t require auth for assessment.

Relationship: Managers click Preview from listing drill-down to confirm what will be public.

6) /settings (Integrations)

Goal: data control + Google exploration.

Components

Mock Data card: upload JSON → re-seed DB; show counts, last import

Google Reviews Test card:

Place ID input

“Test Fetch” → server calls Google (if key available)

If returned, show count + option “Include Google reviews” toggle (store channel:"google")

Data

local; triggers seed or test endpoint

Primary actions

Control your dataset quickly for the demo

Demonstrate initiative with Google

C) Navigation & UI relationships (user flow)

Manager opens /dashboard
Sees KPIs + trend. Spots “Top listings”.
→ Clicks “Go to Reviews”.

On /reviews
Applies filters (e.g., last 30 days, Airbnb) → table updates.
Toggles Selected ON for some 5★ reviews.
Clicks one suspicious review → /reviews/[id].

On /reviews/[id]
Reads full text, sets note “wifi issue”, leaves it unselected (or selected).
Next/Prev to triage a few, then back to /reviews via breadcrumb.

From /reviews
Filters by a specific listing; presses View Listing → /listings/[id].

On /listings/[id]
Sees property stats, category problems (e.g., “cleanliness < 8”).
Moderates a few more reviews in context.
Presses Preview public page → /preview/[slug]?key=....

On /preview/[slug]
Confirms that only approved reviews are visible in a nice Flex-style page.
Copies the URL (demo-ready).

Optional /settings
Upload a new mock file to reseed.
Test Google Place ID → if successful, include in channel mix.

That’s the full loop. Every page has a clear purpose and feeds the next one.

Data model (Drizzle + SQLite)
// listings
id: string (pk)        // "L-29"
name: string
slug: string           // "29-shoreditch-heights"
createdAt, updatedAt

// reviews
id: string (pk)
listingId: string (fk -> listings.id)
listingName: string
channel: 'hostaway' | 'google' | 'airbnb' | 'booking' | 'direct'
type: 'host-to-guest' | 'guest-to-host'
status: 'published' | 'draft'
overallRating: number | null
categoriesJson: json   // [{key:'cleanliness', rating:10}, ...]
submittedAt: string    // ISO
guestName: string
publicReview: string
selectedForWeb: boolean
note?: string
tagsJson?: json
createdAt, updatedAt

// audits (tiny but impressive)
id: string (pk)
actor: string          // 'admin@demo'
action: 'select' | 'unselect'
entityType: 'review'
entityId: string
payloadJson: json
createdAt

API contracts (quick but clear)
GET /api/reviews/hostaway

Query: page=1&limit=20&listingId=&channel=&type=&from=&to=&minRating=&selectedOnly=
200:

{
  "reviews": [ { "id":"7453", "listingId":"L-29", "listingName":"2B N1 A - 29 Shoreditch Heights",
    "channel":"hostaway","type":"host-to-guest","status":"published",
    "overallRating":null,"categories":[{"key":"cleanliness","rating":10}],
 - Use absolute imports via $lib; strict TS.
 - Seed ensures mock JSON exists if missing.
    "submittedAt":"2020-08-21T22:45:14Z","guestName":"Shane F.","publicReview":"...","selectedForWeb":false } ],
  "listings": [ {"id":"L-29","name":"2B N1 A - 29 Shoreditch Heights"} ],
  "meta": { "page":1, "limit":20, "total": 324 }
}

POST /api/reviews/selection

Body: { "reviewId":"7453", "selectedForWeb": true, "note":"great wifi" }
200: { "ok": true }

GET /api/listings/[id]/selected-reviews

200: { "listing": {...}, "reviews": [ /* only selectedForWeb:true */ ] }

GET /api/reviews/stats (optional but helps)

200:

{
  "kpis": { "avgRating": 4.62, "reviewCount": 324, "fiveStarPct": 0.73, "last30dDelta": +0.12 },
  "channels": [ {"channel":"airbnb","count":180}, {"channel":"google","count":40} ],
  "trend": [ {"week":"2025-30","avg":4.5}, {"week":"2025-31","avg":4.7} ],
  "categories": [ {"key":"cleanliness","avg":9.1}, {"key":"communication","avg":9.6} ],
  "topListings": [ {"listingId":"L-29","name":"...","avg":4.8,"reviews":128} ]
}

File structure (SvelteKit)
src/
  lib/
    db/
      drizzle.ts
      schema.ts
      seed.ts
    normalization/
      hostaway.ts          // parse mock JSON -> canonical Review[]
      google.ts            // optional mapping
    services/
      reviews.ts           // filtering, pagination, selection
      stats.ts             // KPI/trend aggregation
    components/
      KpiCards.svelte
      FiltersBar.svelte
      ReviewsTable.svelte
      TrendLineChart.svelte
      CategoryBadges.svelte
      ChannelPill.svelte
  routes/
    dashboard/+page.svelte
    reviews/+page.svelte
    reviews/[id]/+page.svelte
    listings/+page.svelte            // optional simple list
    listings/[id]/+page.svelte
    preview/[slug]/+page.svelte
    settings/+page.svelte

    api/
      reviews/
        hostaway/+server.ts          // GET
        selection/+server.ts         // POST
        stats/+server.ts             // GET
      listings/[id]/
        selected-reviews/+server.ts  // GET

Two-Day Execution Plan (hour-by-hour)
Day 1 — CORE (8–10h)

Hour 1–2

SvelteKit app, Tailwind, SkeletonUI/Flowbite.

Drizzle + SQLite setup, define schema.

Seed script: load provided mock JSON → normalization/hostaway.ts → insert listings/reviews.