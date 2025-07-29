import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/footer";
import { MigrationProvider } from "@/components/ui/migration-provider";
import { Toaster } from "sonner";
import { generateBaseMetadata, generateWebsiteStructuredData } from "@/lib/seo-utils";
import "./globals.css";
import { Suspense } from "react";
import { PerformanceProvider } from "@/components/ui/performance-provider";
import { KeyboardNavigationProvider } from "@/components/ui/keyboard-navigation-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = generateBaseMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteStructuredData = generateWebsiteStructuredData();

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
        <link rel="dns-prefetch" href="//image.tmdb.org" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen`}
      >
        <PerformanceProvider>
          <KeyboardNavigationProvider>
            <Navbar />
            <main id="main-content" tabIndex={-1}>
              <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            </main>
            <Footer />
            <MigrationProvider />
            <Toaster position="bottom-center" />
          </KeyboardNavigationProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
