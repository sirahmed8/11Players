import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider, LocaleProvider } from "@/components/ui/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import { ProSubscriptionProvider } from "@/contexts/ProSubscriptionContext";
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
import SubscriptionGiftModal from "@/components/ui/SubscriptionGiftModal";
import ClaimUsernameModal from "@/components/auth/ClaimUsernameModal";
import CookieConsentBanner from "@/components/layout/CookieConsentBanner";
import ScrollToTop from "@/components/ui/ScrollToTop";
import StickyMobileCTA from "@/components/layout/StickyMobileCTA";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://an-11-players.web.app"),
  alternates: {
    canonical: "/",
  },
  title: {
    default:  "11Players - Football Matchmaking & Community",
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
    title:       "11Players | Football Matchmaking & Community",
    description: "Organize matches, rate players, and compete in your community league.",
    siteName:    "11Players",
    images: [
      {
        url: "https://an-11-players.web.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "11Players Elite Football Platform",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "11Players | Football Matchmaking & Community",
    description: "Gamified football matchmaking and community management.",
    images: ["https://an-11-players.web.app/og-image.png"],
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
        <meta name="referrer" content="strict-origin-when-cross-origin" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://an-11-players.web.app/#organization",
                  "name": "11Players",
                  "alternateName": "Hagoozat Elite",
                  "url": "https://an-11-players.web.app",
                  "logo": "https://an-11-players.web.app/icon-512.png",
                  "description": "Gamified football matchmaking and community management. Organize matches, rate teammates, track stats, and compete in your own football league.",
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": "support@11players.com",
                    "contactType": "customer service"
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": "https://an-11-players.web.app/#website",
                  "url": "https://an-11-players.web.app",
                  "name": "11Players",
                  "publisher": {
                    "@id": "https://an-11-players.web.app/#organization"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://an-11-players.web.app/communities?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://an-11-players.web.app/#webapp",
                  "name": "11Players",
                  "url": "https://an-11-players.web.app",
                  "applicationCategory": "SportsApplication",
                  "operatingSystem": "All",
                  "description": "Gamified football matchmaking and community management.",
                  "inLanguage": ["ar", "en"],
                  "publisher": {
                    "@id": "https://an-11-players.web.app/#organization"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className="transition-colors duration-300 font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[9999] px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-2xl outline-none ring-2 ring-emerald-400 transition-all"
        >
          تخطي إلى المحتوى الرئيسي / Skip to main content
        </a>
        <LocaleProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <CommunityProvider>
                <AuthProvider>
                  <ProSubscriptionProvider>
                  <PlayersProvider>
                    <InstallPWA />
                    <RouteGuard>
                      <div className="flex flex-col md:flex-row min-h-[100dvh]">
                        <Sidebar />
                        <div id="main-content" className="flex-1 flex flex-col min-w-0 relative z-0">
                          <GlobalAnnouncementBanner />
                          {children}
                          <Footer />
                        </div>
                      </div>
                      <UpdateNotification />
                      <SiteRatingModal />
                      <SubscriptionGiftModal />
                      <ClaimUsernameModal />
                    </RouteGuard>
                    <FloatingChatWidget />
                    <ToastProvider />
                    <CookieConsentBanner />
                    <ScrollToTop />
                    <StickyMobileCTA />
                  </PlayersProvider>
                  </ProSubscriptionProvider>
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
