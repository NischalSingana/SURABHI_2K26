import type { Metadata } from "next";
import Script from "next/script";
import { Schibsted_Grotesk, Martian_Mono, Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Suspense } from "react";

import LenisProvider from "@/components/providers/LenisProvider";
import ConditionalNavbar from "./ConditionalNavbar";
import ClickSpark from "@/components/ui/ClickSpark";
import ChatWidget from "@/components/chat/ChatWidget";

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
  title: "Surabhi",
  description:
    "A website for Surabhi International Cultural Fest by kl university  ",
  creator: "Nischal Singana",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#030303]" suppressHydrationWarning>
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
