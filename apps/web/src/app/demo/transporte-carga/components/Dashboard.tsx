'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { transporteAPI } from '../api';
import {
  TruckIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  PlusIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import KpiCard from './KpiCard';
import EmptyState from './EmptyState';
import type { SeccionId } from '../page';
import type { KPIs } from '../types';

interface DashboardProps {
  onNavigate: (s: SeccionId) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar KPIs desde la API real
    const cargar = async () => {
      setLoading(true);
      try {
        const kpis = await transporteAPI.reportes.kpis();
        setKpis(kpis);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Skeleton Hero */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg p-6 animate-pulse h-24" />
        {/* Skeleton KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-secondary-900 rounded-xl p-6 h-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState title="Sin datos disponibles" description="No se pudieron cargar los KPIs" />
      </div>
    );
  }

  const deltaFacturacion = ((kpis.facturacionMesPEN - kpis.facturacionMesAnterior) / kpis.facturacionMesAnterior) * 100;
  const maxIngreso = Math.max(...kpis.ingresosUltimos6Meses.map(m => m.total)) || 1;

  return (
    <motion.main
      className="p-6 md:p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Buenos días, Administrador
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Resumen operativo de hoy, {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.section>

      {/* KPI Cards Grid */}
      <motion.section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Órdenes activas"
            value={kpis.ordenesActivas}
            icon={TruckIcon}
            color="blue"
            onClick={() => onNavigate('ordenes')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Entregadas este mes"
            value={kpis.ordenesEntregadas}
            icon={CheckCircleIcon}
            color="green"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Facturación del mes"
            value={`S/ ${kpis.facturacionMesPEN.toLocaleString('es-PE')}`}
            delta={deltaFacturacion}
            deltaSuffix="vs mes anterior"
            icon={CurrencyDollarIcon}
            color="purple"
            onClick={() => onNavigate('facturas')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Detracciones del mes"
            value={`S/ ${kpis.detraccionesMes.toLocaleString('es-PE')}`}
            icon={ReceiptPercentIcon}
            color="orange"
          />
        </motion.div>
      </motion.section>

      {/* Two Column Section: Top Clients + Orders by Status */}
      <motion.section
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Top Clientes */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-secondary-900 rounded-xl p-6 shadow-sm border border-secondary-200 dark:border-secondary-700"
        >
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
            Top 5 clientes del mes
          </h3>
          <div className="space-y-3">
            {kpis.topClientes.map((cliente, idx) => (
              <div
                key={cliente.clienteId}
                className="flex items-center justify-between pb-3 border-b border-secondary-100 dark:border-secondary-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                      {idx + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                    {cliente.razonSocial}
                  </span>
                </div>
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                  S/ {cliente.total.toLocaleString('es-PE')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Ordenes por Estado */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-secondary-900 rounded-xl p-6 shadow-sm border border-secondary-200 dark:border-secondary-700"
        >
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
            Órdenes por estado
          </h3>
          <div className="space-y-3">
            {kpis.ordenesPorEstado.map((item) => {
              const colors: Record<string, string> = {
                borrador: 'bg-secondary-400',
                confirmada: 'bg-blue-500',
                en_ruta: 'bg-indigo-500',
                entregada: 'bg-green-500',
                facturada: 'bg-purple-500',
                anulada: 'bg-red-500',
              };

              const labels: Record<string, string> = {
                borrador: 'Borrador',
                confirmada: 'Confirmada',
                en_ruta: 'En ruta',
                entregada: 'Entregada',
                facturada: 'Facturada',
                anulada: 'Anulada',
              };

              const maxCount = Math.max(...kpis.ordenesPorEstado.map(s => s.count)) || 1;

              return (
                <div key={item.estado} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-secondary-600 dark:text-secondary-400 w-20 truncate">
                    {labels[item.estado]}
                  </span>
                  <div className="flex-1 h-6 bg-secondary-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${colors[item.estado]} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxCount) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-sm font-bold text-secondary-900 dark:text-white w-8 text-right">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.section>

      {/* Full Width: Ingresos ultimos 6 meses */}
      <motion.section
        variants={itemVariants}
        className="bg-white dark:bg-secondary-900 rounded-xl p-6 shadow-sm border border-secondary-200 dark:border-secondary-700"
      >
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-6">
          Ingresos últimos 6 meses
        </h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {kpis.ingresosUltimos6Meses.map((item, idx) => (
            <motion.div
              key={item.mes}
              className="flex-1 flex flex-col items-center gap-2"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
            >
              <div className="flex-1 flex items-end w-full">
                <motion.div
                  className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg shadow-sm"
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.total / maxIngreso) * 100}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.08 + 0.1 }}
                  title={`S/ ${item.total.toLocaleString('es-PE')}`}
                />
              </div>
              <span className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">
                {item.mes}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.button
          variants={itemVariants}
          onClick={() => onNavigate('ordenes')}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
        >
          <PlusIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 text-center">
            Nueva orden
          </span>
        </motion.button>

        <motion.button
          variants={itemVariants}
          onClick={() => onNavigate('guias')}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800"
        >
          <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300 text-center">
            Emitir guía
          </span>
        </motion.button>

        <motion.button
          variants={itemVariants}
          onClick={() => onNavigate('facturas')}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-purple-200 dark:border-purple-800"
        >
          <ReceiptRefundIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300 text-center">
            Emitir factura
          </span>
        </motion.button>

        <motion.button
          variants={itemVariants}
          onClick={() => onNavigate('reportes')}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors border border-orange-200 dark:border-orange-800"
        >
          <ChartBarIcon className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300 text-center">
            Ver reportes
          </span>
        </motion.button>
      </motion.section>
    </motion.main>
  );
}