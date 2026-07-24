import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider, LocaleProvider } from "@/components/ui/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import GlobalAnnouncementBanner from "@/components/layout/GlobalAnnouncementBanner";
import TopNav from "@/components/layout/TopNav";
import InstallPWA from "@/components/layout/InstallPWA";
import RouteGuard from "@/components/auth/RouteGuard";
import UpdateNotification from "@/components/layout/UpdateNotification";
import SiteRatingModal from "@/components/ui/SiteRatingModal";
import ToastProvider from "@/components/ui/ToastProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "11Players - Football Matchmaking & Community",
  description: "Highly balanced matchmaking system for amateur football players",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.className = savedTheme;
                  const savedLocale = localStorage.getItem('locale') || 'ar';
                  document.documentElement.lang = savedLocale;
                  document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';

                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        registration.unregister();
                      }
                      console.log('ServiceWorkers unregistered successfully');
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="transition-colors duration-300">
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
                          <TopNav />
                          {children}
                          <Footer />
                        </div>
                      </div>
                      <UpdateNotification />
                      <SiteRatingModal />
                    </RouteGuard>
                  <ToastProvider />
                  </PlayersProvider>
                </AuthProvider>
              </CommunityProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}



