'use client';

import React from 'react';
import ReaderLayout from '@/components/layout/ReaderLayout';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReaderLayout>
      <div className="w-full flex items-center justify-center py-6 sm:py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </ReaderLayout>
  );
}
