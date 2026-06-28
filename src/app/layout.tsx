import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, LocaleProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "11Players - Football Matchmaking & Community",
  description: "Highly balanced matchmaking system for amateur football players",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
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
                    <div className="flex flex-col md:flex-row min-h-screen">
                      <Sidebar />
                      <div className="flex-1 flex flex-col min-w-0">
                        {children}
                        <Footer />
                      </div>
                    </div>
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
