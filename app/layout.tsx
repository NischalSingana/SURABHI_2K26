import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Schibsted_Grotesk, Martian_Mono, Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Suspense } from "react";

import LenisProvider from "@/components/providers/LenisProvider";
import ConditionalNavbar from "./ConditionalNavbar";
import ClickSpark from "@/components/ui/ClickSpark";
import ChatWidget from "@/components/chat/ChatWidget";
import { getAppVersion } from "@/lib/app-version";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-Schibsted_Grotesk",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-Martian_Mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-Lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://klusurabhi.in"),
  title: {
    default: "Surabhi 2K26",
    template: "%s | Surabhi 2K26",
  },
  description:
    "Surabhi 2K26 — KL University’s international cultural fest. Explore competitions, events, schedule, and updates.",
  creator: "Nischal Singana",
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Surabhi 2K26",
    title: "Surabhi 2K26",
    description:
      "KL University’s international cultural fest. Explore competitions, events, schedule, and updates.",
    images: [
      {
        url: "/images/surabhi_white_logo.png",
        alt: "Surabhi 2K26",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Surabhi 2K26",
    description:
      "KL University’s international cultural fest. Explore competitions, events, schedule, and updates.",
    images: ["/images/surabhi_white_logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Ensure Tailwind breakpoints behave correctly on phones
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appVersion = getAppVersion();
  return (
    <html lang="en" className="bg-[#030303]" suppressHydrationWarning>
      <head>
        {/* Speed up hero video fetch */}
        <link
          rel="preconnect"
          href="https://surabhi-images.sgp1.cdn.digitaloceanspaces.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://surabhi-images.sgp1.digitaloceanspaces.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${schibstedGrotesk.variable} ${martianMono.variable} ${lexend.variable} bg-[#030303] min-h-screen text-zinc-100`}
        style={{ backgroundColor: "#030303" }}
        suppressHydrationWarning
      >
        {/* Critical: prevent dark→light flash - run before React hydrates */}
        <Script
          id="dark-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.style.backgroundColor='#030303';document.body.style.backgroundColor='#030303';",
          }}
        />
        <Script
          id="app-version-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__APP_VERSION__=${JSON.stringify(appVersion)};`,
          }}
        />
        {/* Auto-reload on chunk load failures (happens after new deployments) */}
        <Script
          id="chunk-error-handler"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var onceKey="surabhi_chunk_reload_once";window.addEventListener("error",function(e){var m=(e&&e.message||"")+(e&&e.filename||"");var isChunk=m.indexOf("Loading chunk")!==-1||m.indexOf("ChunkLoadError")!==-1||m.indexOf("/_next/static/chunks/")!==-1;if(!isChunk)return;try{if(sessionStorage.getItem(onceKey)==="1"){return;}sessionStorage.setItem(onceKey,"1");}catch(_e){}window.location.reload();},true)})();`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: "html,body,main{background-color:#030303!important}html{color-scheme:dark}",
          }}
        />
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#ffffff',
              maxWidth: '400px',
              minWidth: '300px',
            },
            classNames: {
              closeButton: 'toast-close-button !left-auto !right-0 !top-0 !transform !translate-x-1/3 !-translate-y-1/3',
            },
          }}
        />
        <LenisProvider>
          <ClickSpark
            sparkColor='#ff8c42'
            sparkSize={12}
            sparkRadius={20}
            sparkCount={12}
            duration={500}
          >
            <Suspense fallback={<div className="h-20 bg-transparent" />}>
              <ConditionalNavbar />
            </Suspense>
            {children}
            <ChatWidget />
          </ClickSpark>
        </LenisProvider>
      </body>
    </html>
  );
}
