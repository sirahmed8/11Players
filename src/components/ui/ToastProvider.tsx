"use client";
import { Toaster } from "react-hot-toast";
import { useLocale } from "@/components/ui/ThemeProvider";

export default function ToastProvider() {
  const { direction } = useLocale();
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          borderRadius: '16px',
          border: '1px solid #334155',
          direction: direction,
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  );
}
