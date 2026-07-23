"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GlobalUsersTable from "@/components/admin/GlobalUsersTable";

export default function UsersPage() {
  return (
    <ProtectedRoute ownerOnly>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
        <main className="max-w-7xl mx-auto px-4 py-8">
          <GlobalUsersTable />
        </main>
      </div>
    </ProtectedRoute>
  );
}
