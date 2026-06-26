import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center py-16 px-6">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">Privacy Policy</h1>
        <p className="mb-4">Last updated: 2026</p>
        <p className="mb-4">This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Information Collection</h2>
        <p className="mb-4">We collect information to provide better services to all our users. We may collect personal information such as your name, email address, and performance statistics within our application.</p>
        <h2 className="text-xl font-semibold mt-6 mb-3">2. Use of Information</h2>
        <p className="mb-4">The information we collect is used to personalize your experience, improve our website, and provide our core matchmaking service.</p>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <Link href="/" className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
