# Vercel Deployment Guide

## Prerequisites
- Vercel account (free tier available)
- GitHub repository containing this project
- Google Maps/Places API keys

## Quick Deploy Option 1: Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? No
   - Project name: reviews-dashboard (or your preferred name)
   - Framework: SvelteKit
   - Build command: npm run build
   - Output directory: .svelte-kit/output

## Quick Deploy Option 2: Vercel Dashboard

1. **Push code to GitHub** (if not already done)
2. **Go to [vercel.com](https://vercel.com)** and sign in
3. **Click "New Project"**
4. **Import from GitHub** and select this repository
5. **Configure project**:
   - Framework: SvelteKit (should auto-detect)
   - Build command: `npm run build`
   - Output directory: `.svelte-kit/output`

## Environment Variables Setup

In Vercel dashboard or during CLI deployment, add these environment variables:

### Required:
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
DATABASE_URL=file:./data.db
HOSTAWAY_API_KEY=your_hostaway_api_key_here
HOSTAWAY_ACCOUNT_ID=your_hostaway_account_id_here
```

### Optional:
```
PUBLIC_GOOGLE_MAPS_API_KEY=your_public_maps_key_here
PUBLIC_APP_NAME=FlexLiving Reviews Dashboard
PUBLIC_APP_VERSION=1.0.0
```

## Database Configuration

For production, you may want to use a hosted database instead of SQLite:

### Option 1: Keep SQLite (Simple)
- Use the default `DATABASE_URL=file:./data.db`
- Database will be recreated on each deployment

### Option 2: PostgreSQL (Recommended for production)
1. Set up a PostgreSQL database (Vercel Postgres, Supabase, etc.)
2. Update `DATABASE_URL` to your PostgreSQL connection string
3. Update `src/lib/server/database/connection.ts` if needed

## Post-Deployment Steps

1. **Verify deployment** at your Vercel URL
2. **Test Google Maps integration** on property pages
3. **Test amenities modal** functionality
4. **Check sidebar navigation** responsiveness
5. **Verify database seeding** worked correctly

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS as instructed

## Performance Tips

- Google Maps API calls are cached client-side
- Images are optimized automatically by Vercel
- Static assets are served from CDN
- Database queries use connection pooling

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (18.x)
- Check environment variables are set correctly

### Maps Not Loading
- Verify `GOOGLE_MAPS_API_KEY` is set
- Check API key has required permissions
- Ensure billing is enabled for Google Cloud Project

### Database Issues
- Check `DATABASE_URL` format
- Verify database migrations ran successfully
- Check if seed data was created

## Support

For issues:
1. Check Vercel deployment logs
2. Review browser console for client-side errors
3. Verify environment variables in Vercel dashboard
