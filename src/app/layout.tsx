import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider, LocaleProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import InstallPWA from "@/components/InstallPWA";
import RouteGuard from "@/components/RouteGuard";
import UpdateNotification from "@/components/UpdateNotification";
import SiteRatingModal from "@/components/SiteRatingModal";
import { Toaster } from "react-hot-toast";
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
    <html lang="ar" dir="rtl" className="dark">
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
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(
                        function(registration) {
                          console.log('ServiceWorker registration successful');
                        },
                        function(err) {
                          console.log('ServiceWorker registration failed: ', err);
                        }
                      );
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
                          {children}
                          <Footer />
                        </div>
                      </div>
                      <UpdateNotification />
                      <SiteRatingModal />
                    </RouteGuard>
                  <Toaster
                    position="bottom-center"
                    toastOptions={{
                      style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '16px',
                        border: '1px solid #334155',
                      },
                      success: {
                        iconTheme: {
                          primary: '#10b981',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
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
