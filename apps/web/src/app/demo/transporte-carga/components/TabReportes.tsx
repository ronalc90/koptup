'use client';

import React, { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Orden, Factura, Vehiculo, Conductor, Cliente } from '../store';

interface TabReportesProps {
  ordenes: Orden[];
  facturas: Factura[];
  vehiculos: Vehiculo[];
  conductores: Conductor[];
  clientes: Cliente[];
}

export function TabReportes({
  ordenes,
  facturas,
  vehiculos,
  conductores,
  clientes,
}: TabReportesProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const monthlyOrders = ordenes.filter(
      (o) => new Date(o.createdAt).getMonth() === currentMonth && new Date(o.createdAt).getFullYear() === currentYear
    );
    const monthlyFacturas = facturas.filter(
      (f) => new Date(f.createdAt).getMonth() === currentMonth && new Date(f.createdAt).getFullYear() === currentYear
    );

    return {
      activeOrders: ordenes.filter((o) => ['confirmada', 'en_ruta'].includes(o.estado)).length,
      deliveredOrders: ordenes.filter((o) => ['entregada', 'facturada'].includes(o.estado)).length,
      currentMonthBilling: monthlyFacturas.reduce((sum, f) => sum + f.total, 0),
      totalDetraccion: facturas.reduce((sum, f) => sum + (f.detraccion || 0), 0),
      topClients: Object.entries(
        facturas.reduce(
          (acc, f) => {
            const key = f.clienteRazonSocial;
            acc[key] = (acc[key] || 0) + f.total;
            return acc;
          },
          {} as Record<string, number>
        )
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      topVehicles: vehiculos.slice(0, 5).map((v) => ({
        placa: v.placa,
        orders: ordenes.filter((o) => o.vehiculoId === v.id).length,
      })),
      topConductors: conductores.slice(0, 5).map((c) => ({
        nombre: `${c.nombres} ${c.apellidos}`,
        orders: ordenes.filter((o) => o.conductorId === c.id).length,
      })),
      ordersByStatus: {
        borrador: ordenes.filter((o) => o.estado === 'borrador').length,
        confirmada: ordenes.filter((o) => o.estado === 'confirmada').length,
        en_ruta: ordenes.filter((o) => o.estado === 'en_ruta').length,
        entregada: ordenes.filter((o) => o.estado === 'entregada').length,
        facturada: ordenes.filter((o) => o.estado === 'facturada').length,
      },
    };
  }, [ordenes, facturas, vehiculos, conductores, clientes]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Ordenes Activas</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.activeOrders}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Ordenes Entregadas</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.deliveredOrders}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Facturación Mes</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">S/ {stats.currentMonthBilling.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Detracciones Total</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">S/ {stats.totalDetraccion.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Top 10 Clientes por Facturación</span>
          </h3>
          <div className="space-y-3">
            {stats.topClients.length === 0 ? (
              <p className="text-slate-500">Sin datos</p>
            ) : (
              stats.topClients.map(([name, amount], i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-slate-900 dark:text-white">{name}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">S/ {(amount as number).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span>Órdenes por Estado</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300 capitalize">{status}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.ordersByStatus))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top 5 Vehículos</h3>
          <div className="space-y-2">
            {stats.topVehicles.length === 0 ? (
              <p className="text-slate-500">Sin datos</p>
            ) : (
              stats.topVehicles.map((v, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
                  <span className="font-medium text-slate-900 dark:text-white">{v.placa}</span>
                  <span className="text-slate-600 dark:text-slate-400">{v.orders} órdenes</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top 5 Conductores</h3>
          <div className="space-y-2">
            {stats.topConductors.length === 0 ? (
              <p className="text-slate-500">Sin datos</p>
            ) : (
              stats.topConductors.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
                  <span className="font-medium text-slate-900 dark:text-white">{c.nombre}</span>
                  <span className="text-slate-600 dark:text-slate-400">{c.orders} órdenes</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
