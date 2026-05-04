'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  BarChart3,
  Users,
  Truck,
  Package,
  FileText,
  MapPin,
  Car,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '#dashboard' },
  { icon: Users, label: 'Clientes', href: '#clientes' },
  { icon: Truck, label: 'Conductores', href: '#conductores' },
  { icon: Car, label: 'Vehículos', href: '#vehiculos' },
  { icon: Package, label: 'Órdenes', href: '#ordenes' },
  { icon: MapPin, label: 'Guías', href: '#guias' },
  { icon: FileText, label: 'Facturas', href: '#facturas' },
  { icon: BarChart3, label: 'Reportes', href: '#reportes' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isOpen ? { x: 0 } : { x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 dark:bg-slate-950 text-white z-40 md:static md:translate-x-0 md:z-0 flex flex-col"
      >
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold">Transporte Carga</h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.includes(item.href.replace('#', ''));

            return (
              <button
                key={item.href}
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-6 border-t border-slate-700">
          <Link
            href="/demo"
            className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Volver al Demo</span>
          </Link>
        </div>
      </motion.aside>
    </>
  );
}
