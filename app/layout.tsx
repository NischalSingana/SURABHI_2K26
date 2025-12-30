import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Suspense } from "react";

import LenisProvider from "@/components/providers/LenisProvider";
import ConditionalNavbar from "./ConditionalNavbar";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-Schibsted_Grotesk",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-Martian_Mono",
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
        className={`${schibstedGrotesk.variable} ${martianMono.variable} antialiased bg-black min-h-screen`}
      >
        <Toaster position="top-right" richColors />
        <LenisProvider>
          <Suspense fallback={<div className="h-16 bg-black" />}>
            <ConditionalNavbar />
          </Suspense>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
