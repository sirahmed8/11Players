import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center py-16 px-6">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">Terms of Service</h1>
        <p className="mb-4">Last updated: 2026</p>
        <p className="mb-4">Please read these terms and conditions carefully before using Our Service.</p>
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
        <p className="mb-4">By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>
        <h2 className="text-xl font-semibold mt-6 mb-3">2. User Conduct</h2>
        <p className="mb-4">Users must provide accurate information when creating their player profile and must not engage in any activity that disrupts the platform.</p>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <Link href="/" className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
