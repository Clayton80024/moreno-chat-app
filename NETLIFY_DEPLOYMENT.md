# Netlify Deployment Guide

## Environment Variables Setup

Add these environment variables in your Netlify dashboard:

### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://douzrnpcfrxavsefekyr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdXpybnBjZnJ4YXZzZWZla3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjI0MzYsImV4cCI6MjA3MjU5ODQzNn0.BvIMbxLMdBnYiNA9Fx8qLRUJLiYp5LHtfXM8xaVbdXs
NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY=AIzaSyA_BvHV9rf3SS-2MKWIL-f8bYfp1nGpm0g
```

### How to Add Environment Variables:
1. Go to your Netlify dashboard
2. Select your site (morenochat.netlify.app)
3. Go to Site Settings → Environment Variables
4. Click "Add Variable"
5. Add each variable with the exact name and value above

### Build Settings:
- Build Command: `npm run build`
- Publish Directory: `.next`
- Node Version: 18.x or 20.x

## Common Issues & Solutions:

### 1. Client-side Exception Error
- **Cause**: Missing environment variables
- **Solution**: Add all required environment variables above

### 2. Build Failures
- **Cause**: TypeScript errors or missing dependencies
- **Solution**: Run `npm run build` locally first to check for errors

### 3. Translation Not Working
- **Cause**: Google Translate API key not set
- **Solution**: Add `NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY` environment variable

### 4. Database Connection Issues
- **Cause**: Supabase credentials not set
- **Solution**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## After Adding Environment Variables:
1. Redeploy your site (trigger a new build)
2. Clear browser cache
3. Test the application

The app should work perfectly after setting up these environment variables!
