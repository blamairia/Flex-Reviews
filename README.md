# Reviews Dashboard (SvelteKit + Drizzle + SQLite)

Minimal Day-1 scope implementation.

## Quick start

1) Install deps

```bash
pnpm install
```

2) Generate & run DB seed

```bash
pnpm db:seed
```

3) Dev server

```bash
pnpm dev
```

## API sanity

```bash
curl "http://localhost:5173/api/reviews/hostaway?limit=5"

curl -X POST "http://localhost:5173/api/reviews/selection" \
  -H "content-type: application/json" \
  -d '{"reviewId":"7453","selectedForWeb":true}'
```

## Pages

- /reviews: filters + table with selection toggles
- /preview/[slug]: shows only selected reviews for a listing

## Notes

- SQLite file at `./data/app.db` is created automatically.
- Seed reads `static/mock/hostaway-reviews.json`. If missing, a small sample is generated.
- Strict TS and absolute imports via `$lib/*`.
- UI kit: Tailwind + Skeleton (basic styles).

