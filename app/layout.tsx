import type { Metadata } from "next";
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
  creator: "M.Vishnu vardhan reddy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${schibstedGrotesk.variable} ${martianMono.variable} ${lexend.variable} bg-[#0a0e1a] min-h-screen`}
      >
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
              closeButton: 'toast-close-button',
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
