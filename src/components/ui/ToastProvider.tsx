"use client";

import { Toaster } from "react-hot-toast";
import { useLocale } from "@/components/ui/ThemeProvider";

export default function ToastProvider() {
  const { direction } = useLocale();

  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(9, 13, 22, 0.95)',
          color: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(30, 41, 59, 0.8)',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.15)',
          backdropFilter: 'blur(16px)',
          padding: '12px 20px',
          fontSize: '13px',
          fontWeight: 800,
          direction: direction,
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#090d16' },
        },
        error: {
          iconTheme: { primary: '#f43f5e', secondary: '#090d16' },
        },
      }}
    />
  );
}
