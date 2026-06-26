import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, LocaleProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import React from "react";

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
              <AuthProvider>
                {children}
              </AuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
