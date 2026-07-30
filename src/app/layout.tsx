import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider, LocaleProvider } from "@/components/ui/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import GlobalAnnouncementBanner from "@/components/layout/GlobalAnnouncementBanner";
import TopNav from "@/components/layout/TopNav";
import Footer from "@/components/layout/Footer";
import InstallPWA from "@/components/layout/InstallPWA";
import RouteGuard from "@/components/auth/RouteGuard";
import UpdateNotification from "@/components/layout/UpdateNotification";
import SiteRatingModal from "@/components/ui/SiteRatingModal";
import ToastProvider from "@/components/ui/ToastProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default:  "11Players — Football Matchmaking & Community",
    template: "%s | 11Players",
  },
  description:
    "Gamified football matchmaking and community management. Organize matches, rate teammates, track stats, and compete in your own football league.",
  manifest: "/manifest.json",
  keywords: [
    "football",
    "soccer",
    "matchmaking",
    "community",
    "team balancer",
    "player rating",
    "كرة القدم",
    "مجتمع",
  ],
  authors:  [{ name: "11Players Team" }],
  creator:  "11Players",
  openGraph: {
    type:        "website",
    locale:      "ar_SA",
    alternateLocale: ["en_US"],
    title:       "11Players — Football Matchmaking & Community",
    description: "Organize matches, rate players, and compete in your community league.",
    siteName:    "11Players",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "11Players",
    description: "Gamified football matchmaking and community management.",
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor:    "#10b981",
  width:         "device-width",
  initialScale:  1,
  maximumScale:  5,
};

import FloatingChatWidget from "@/components/ui/FloatingChatWidget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inter font — weights 400 → 900 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        <meta name="referrer" content="no-referrer" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme') || 'dark';
                  document.documentElement.className = t;
                  var l = localStorage.getItem('locale') || 'ar';
                  document.documentElement.lang = l;
                  document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="transition-colors duration-300 font-sans">
        <LocaleProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <CommunityProvider>
                <AuthProvider>
                  <PlayersProvider>
                    <InstallPWA />
                    <RouteGuard>
                      <div className="flex flex-col md:flex-row min-h-[100dvh]">
                        <Sidebar />
                        <div className="flex-1 flex flex-col min-w-0">
                          <GlobalAnnouncementBanner />
                          {children}
                          <Footer />
                        </div>
                      </div>
                      <UpdateNotification />
                      <SiteRatingModal />
                    </RouteGuard>
                    <FloatingChatWidget />
                    <ToastProvider />
                  </PlayersProvider>
                </AuthProvider>
              </CommunityProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LocaleProvider>
        {process.env.NEXT_PUBLIC_VERCEL_ENV && <Analytics />}
      </body>
    </html>
  );
}
