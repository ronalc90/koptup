// apps/web/src/components/ClientToaster.tsx
'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ClientToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { background: '#333', color: '#fff' },
      }}
    />
  );
}
