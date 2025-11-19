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
        style: {
          background: '#fff',
          color: '#363636',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '500px',
        },
        success: {
          duration: 5000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #86efac',
          },
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        loading: {
          style: {
            background: '#eff6ff',
            color: '#1e40af',
            border: '1px solid #93c5fd',
          },
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
