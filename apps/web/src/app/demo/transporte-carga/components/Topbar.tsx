'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, ArrowLeft, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopbarProps {
  title: string;
  role?: 'admin' | 'operador' | 'conductor';
  onRoleChange?: (role: 'admin' | 'operador' | 'conductor') => void;
}

export function Topbar({ title, role = 'admin', onRoleChange }: TopbarProps) {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/demo"
            className="hidden md:block p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
              Demo
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
            >
              {role === 'admin' ? 'Administrador' : role === 'operador' ? 'Operador' : 'Conductor'}
            </button>

            {isRoleMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 overflow-hidden"
              >
                {(['admin', 'operador', 'conductor'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onRoleChange?.(r);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      role === r
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {r === 'admin' ? 'Administrador' : r === 'operador' ? 'Operador' : 'Conductor'}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
