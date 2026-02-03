# Fix Google OAuth on Localhost - Step by Step

## ✅ Code Fixes Applied
- Added explicit `baseURL` to auth client
- Fixed image quality warnings
- Environment detection fixed

## 🔧 Step 1: Restart Dev Server (REQUIRED!)

```bash
# Press Ctrl+C in your terminal to stop the server
# Then restart:
npm run dev
```

**Wait for "Ready" message before proceeding!**

---

## 🌐 Step 2: Verify Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project
3. Click on your OAuth 2.0 Client ID

### Required Settings:

**Authorized JavaScript origins:**
```
http://localhost:3000
https://klusurabhi.in
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://klusurabhi.in/api/auth/callback/google
```

**IMPORTANT:** NO trailing slashes! Must match exactly!

Click **SAVE** if you made any changes.

---

## 🧹 Step 3: Clear Browser Data (CRITICAL!)

### Chrome/Edge:
1. Press **F12** (open DevTools)
2. Go to **Application** tab
3. Under **Storage** section:
   - Click **Clear site data**
   - Check ALL boxes
   - Click **Clear site data** button
4. Close DevTools
5. Close ALL browser tabs for localhost:3000
6. Restart browser

### Or use Incognito Mode:
- **Chrome:** Ctrl+Shift+N
- **Edge:** Ctrl+Shift+P

---

## 🧪 Step 4: Test Google OAuth

1. Open: http://localhost:3000/login
2. Click **"Continue with Google"**
3. You should see Google login page (NOT infinite loading)
4. Login and should redirect back

---

## 🐛 If Still Not Working:

### Check Browser Console:
1. Press **F12**
2. Go to **Console** tab
3. Look for errors (red text)
4. Take a screenshot and share

### Check Network Tab:
1. Press **F12**
2. Go to **Network** tab
3. Click "Continue with Google"
4. Look for failed requests (red)
5. Click on the failed request
6. Take a screenshot of the error

### Verify Environment Variables:
```bash
cat .env | grep GOOGLE
```

Should show:
```
GOOGLE_CLIENT_ID=346668050279-8muk49evmhajifvu9g98e4pdmq70oqhg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

---

## ✅ Expected Behavior:

1. Click "Continue with Google"
2. Redirects to Google login (https://accounts.google.com)
3. Select account
4. Redirects back to http://localhost:3000
5. Logged in successfully!

---

## 🔍 Common Issues & Solutions:

### "redirect_uri_mismatch"
**Solution:** The redirect URI in Google Console must be EXACTLY:
```
http://localhost:3000/api/auth/callback/google
```
(no trailing slash, no HTTPS)

### Infinite loading on localhost
**Solution:** 
1. Clear ALL cookies for localhost:3000
2. Restart dev server
3. Try incognito mode

### "origin_mismatch"
**Solution:** Add `http://localhost:3000` to Authorized JavaScript origins

### Works in production but not localhost
**Solution:** You have different OAuth credentials for localhost vs production. Make sure both URIs are in the SAME OAuth client.

---

## 📞 Still Stuck?

Run these commands and share output:
```bash
# Check if server is running
curl http://localhost:3000/api/auth/callback/google

# Check environment
echo $NODE_ENV

# Check .env file
cat .env | grep -E "GOOGLE|BETTER_AUTH"
```
