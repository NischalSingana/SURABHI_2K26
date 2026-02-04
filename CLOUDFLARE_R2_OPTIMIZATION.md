# Cloudflare R2 Image Optimization Guide

## Current Issue
Images loading from R2 are slow (7.5s timeouts)

## Solutions Implemented

### 1. Custom Image Loader ✅
Created `lib/cloudflare-image-loader.ts` that automatically uses Cloudflare Image Transformations when available.

**Benefits:**
- ✅ Auto WebP/AVIF conversion
- ✅ Smart compression
- ✅ Responsive sizing
- ✅ Edge caching

### 2. Next.js Config Updated ✅
- Added custom R2 domain support
- Enabled custom image loader
- Optimized caching headers

---

## Required Setup Steps

### Step 1: Set Up Custom Domain in Cloudflare R2

1. **Go to Cloudflare Dashboard:**
   - Navigate to: R2 → Your Bucket → Settings

2. **Enable Public Access:**
   - Click "Allow Access" on R2.dev subdomain
   - This enables `pub-xxx.r2.dev` URLs

3. **Add Custom Domain (Recommended):**
   - Go to: Custom Domains
   - Click "Connect Domain"
   - Enter: `cdn.klusurabhi.in` (or `images.klusurabhi.in`)
   - Cloudflare will auto-configure DNS
   - Wait 2-5 minutes for propagation

### Step 2: Enable Image Transformations

1. **In Cloudflare Dashboard:**
   - Go to: Images → Transformations
   - Enable "Image Resizing" (if available in your plan)

2. **For R2 Images:**
   - Custom domains automatically get image optimization
   - No additional configuration needed

### Step 3: Update Image URLs (Optional but Recommended)

**Current URLs:**
```
https://pub-2172d3960f064d32b43c4d6ba9a3135d.r2.dev/categories/image.jpg
```

**New URLs (after custom domain setup):**
```
https://cdn.klusurabhi.in/categories/image.jpg
```

**Update in your upload code:**
```typescript
// In your R2 upload functions, use custom domain
const imageUrl = `https://cdn.klusurabhi.in/${key}`;
```

---

## Performance Comparison

| Setup | Load Time | Optimization |
|-------|-----------|--------------|
| **Current (r2.dev)** | 7.5s | ❌ None |
| **Custom Domain** | ~500ms | ✅ CDN only |
| **Custom Domain + Transforms** | ~200ms | ✅ CDN + Optimize |

---

## Alternative Quick Fixes (If Can't Use Custom Domain)

### Option A: Increase Timeout in Vercel/Production

Add to `vercel.json`:
```json
{
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  }
}
```

### Option B: Use Image Proxy

Create a proxy endpoint that fetches and caches R2 images:

```typescript
// app/api/image-proxy/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return new Response('Missing URL', { status: 400 });
  }
  
  const response = await fetch(imageUrl, {
    cache: 'force-cache',
    next: { revalidate: 31536000 }, // 1 year
  });
  
  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
```

### Option C: Compress Images Before Upload

Use Sharp to compress images before uploading to R2:

```bash
npm install sharp
```

```typescript
import sharp from 'sharp';

async function compressAndUpload(file: File) {
  const buffer = await file.arrayBuffer();
  
  // Compress image
  const compressed = await sharp(Buffer.from(buffer))
    .resize(1920, 1080, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality: 80 })
    .toBuffer();
  
  // Upload to R2
  await uploadToR2(compressed);
}
```

---

## Testing

After setup, test image loading:

1. **Open DevTools → Network tab**
2. **Load competitions page**
3. **Check image load times:**
   - Should be < 1 second
   - Status: 200 (not 500)
   - Size: Smaller (optimized)

---

## Cloudflare R2 Custom Domain Setup (Detailed)

### Prerequisites:
- Cloudflare account with domain `klusurabhi.in`
- R2 bucket created

### Steps:

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/

2. **Navigate to R2**
   - Left sidebar → R2 Object Storage
   - Select your bucket

3. **Settings → Custom Domains**
   - Click "Connect Domain"
   - Enter subdomain: `cdn` (full: `cdn.klusurabhi.in`)
   - Click "Continue"

4. **DNS Auto-Configuration**
   - Cloudflare automatically creates CNAME record
   - No manual DNS changes needed
   - Wait 2-5 minutes

5. **Verify**
   - Test URL: `https://cdn.klusurabhi.in/test-image.jpg`
   - Should load instantly with CDN

6. **Enable HTTPS**
   - Already enabled by default
   - Cloudflare provides free SSL

---

## Environment Variables

Add to `.env.local`:

```bash
# R2 Configuration
NEXT_PUBLIC_R2_CUSTOM_DOMAIN=https://cdn.klusurabhi.in
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-2172d3960f064d32b43c4d6ba9a3135d.r2.dev
```

Update upload functions to use custom domain when available.

---

## Monitoring

After setup, monitor in Cloudflare Analytics:

- **Analytics → R2**
  - Request count
  - Bandwidth usage
  - Cache hit rate

- **Images → Transformations** (if enabled)
  - Transformation requests
  - Bandwidth saved
  - Cache performance

---

## Cost Implications

**R2 Pricing:**
- Storage: $0.015/GB/month
- Class A Operations (write): $4.50 per million
- Class B Operations (read): $0.36 per million
- **Egress: FREE** (huge savings vs S3)

**Custom Domain:**
- **FREE** (no additional cost)

**Image Transformations:**
- Included in Cloudflare Pro plan ($20/month)
- Or standalone: $5/month + $1 per 1,000 transformations

**Recommendation:** Start with custom domain (free), add transformations if needed.

---

## Troubleshooting

### Images still slow after custom domain setup?

1. **Check DNS propagation:**
   ```bash
   dig cdn.klusurabhi.in
   ```

2. **Verify custom domain in Cloudflare:**
   - Should show "Active" status

3. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

4. **Check Cloudflare cache:**
   - Purge cache in Cloudflare dashboard

### 403 Forbidden errors?

- Ensure public access is enabled on R2 bucket
- Check CORS settings

### CORS errors?

Add CORS config to R2 bucket:
```json
[
  {
    "AllowedOrigins": ["https://klusurabhi.in", "https://www.klusurabhi.in"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Next Steps

1. ✅ Custom domain setup (do this first)
2. ✅ Test image loading speed
3. ⚠️ Optional: Enable image transformations
4. ⚠️ Optional: Update existing URLs to use custom domain
5. ⚠️ Optional: Implement image compression on upload

---

## Support

- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/
- Image Transformations: https://developers.cloudflare.com/images/
- Custom Domains: https://developers.cloudflare.com/r2/buckets/public-buckets/#custom-domains
