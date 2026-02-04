import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  // cacheComponents disabled due to incompatibility with API routes using headers()
  // Re-enable when Next.js provides a way to exclude API routes from prerendering
  cacheComponents: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increased from default 1MB to support image uploads
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [70, 75, 85], // Support multiple quality levels
    minimumCacheTTL: 31536000, // 1 year cache for images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    // Custom loader disabled - causes issues with local images
    // R2 images will still be optimized through Next.js default loader
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.klusurabhi.in", // Custom R2 domain with CDN
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.imghippo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "your-bucket.your-domain.com", // Replace with your custom R2 domain if using one
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.digitaloceanspaces.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/poster-gallery/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/gallery',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com https://us-assets.i.posthog.com https://us.i.posthog.com https://*.googleusercontent.com https://accounts.google.com https://login.microsoftonline.com; object-src 'none';",
          },
        ],
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // Explicitly set the root to avoid issues with multiple lockfiles in parent directories
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
