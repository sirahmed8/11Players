'use client';

import React, { useEffect } from 'react';

export default function AchievementsPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/skill-tree?tab=achievements');
    }
  }, []);

  return null;
}
