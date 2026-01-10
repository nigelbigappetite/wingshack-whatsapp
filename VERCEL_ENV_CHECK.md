# Vercel Environment Variables Checklist

## Required Variables

Make sure these are set **exactly** as shown (no trailing spaces, exact case):

### 1. NEXT_PUBLIC_SUPABASE_URL
**Value:** `https://rncpniibgeicdzcxvjzw.supabase.co`
- ✅ No trailing space
- ✅ No trailing slash
- ✅ Exact match with your Supabase project URL

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY3BuaWliZ2VpY2R6Y3h2anp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzMyNjIsImV4cCI6MjA4MjY0OTI2Mn0.goxuInKIVMufecZf8oKlIPCtbGJOpkZ1sRjzhNJv_H8`
- ✅ Full JWT token (should be a long string)
- ✅ This is the "anon public" key from Supabase

## How to Set in Vercel

1. Go to: https://vercel.com → Your Project → Settings → Environment Variables
2. For each variable:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL` (exact, case-sensitive)
   - **Value:** `https://rncpniibgeicdzcxvjzw.supabase.co` (no trailing space!)
   - **Environment:** Check "Production" (and Preview if you want)
   - Click "Save"

3. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## After Adding Variables

**IMPORTANT:** You MUST redeploy after adding/updating environment variables:

1. Go to: Deployments tab
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Wait for build to complete (1-2 minutes)

## Verify

After redeploy, check:
- Build logs show no errors about missing variables
- Browser console shows no "Missing required environment variable" errors
- Page loads without "Application error"

## Common Issues

- ❌ Trailing space in URL: `https://...supabase.co ` (has space at end)
- ❌ Wrong variable name: `NEXT_PUBLIC_SUPABASE_URL_` (extra underscore)
- ❌ Variables not enabled for Production environment
- ❌ Forgot to redeploy after adding variables

