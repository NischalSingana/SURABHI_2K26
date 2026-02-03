# Google OAuth Localhost Fix

## Applied Code Fixes ✅

1. **Cookie Settings**: Changed `secure: false` for localhost (HTTP)
2. **Domain Settings**: Set `domain: undefined` to work with localhost
3. **Google OAuth Scopes**: Added explicit scopes and authorization params
4. **Consent Prompt**: Added `prompt: "consent"` to force fresh login

## Google Cloud Console Setup (IMPORTANT!)

You MUST configure your Google OAuth app to allow localhost:

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials
2. Select your project (Surabhi Website)
3. Click on your OAuth 2.0 Client ID

### Step 2: Add Localhost URIs
Under **Authorized redirect URIs**, make sure you have:
```
http://localhost:3000/api/auth/callback/google
```

Under **Authorized JavaScript origins**, add:
```
http://localhost:3000
```

### Step 3: Save Changes
Click "SAVE" at the bottom

### Step 4: Clear Browser Data
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Clear all cookies for localhost:3000
4. Clear Local Storage
5. Clear Session Storage

### Step 5: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Testing

1. Open: http://localhost:3000/login
2. Click "Continue with Google"
3. Should redirect to Google login page
4. After login, should redirect back to localhost

## Common Issues

### Issue: "redirect_uri_mismatch"
**Fix**: The redirect URI in Google Console must EXACTLY match:
```
http://localhost:3000/api/auth/callback/google
```

### Issue: Still infinite loading
**Fix**: 
1. Check browser console for errors
2. Clear all localhost cookies
3. Try incognito mode
4. Verify Google Client ID/Secret in .env

### Issue: "origin_mismatch"
**Fix**: Add `http://localhost:3000` to Authorized JavaScript origins

## Environment Variables
Make sure these are set in `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
BETTER_AUTH_URL=http://localhost:3000
```

## Production vs Development

The code automatically detects:
- **Development** (localhost): Uses HTTP, allows insecure cookies
- **Production**: Uses HTTPS, secure cookies

No need to change code when deploying!
