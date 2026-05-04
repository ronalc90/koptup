'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Tabs } from './components/Tabs';
import { TabClientes } from './components/TabClientes';
import { TabOrdenes } from './components/TabOrdenes';
import { TabGuias } from './components/TabGuias';
import { TabFacturas } from './components/TabFacturas';
import { TabReportes } from './components/TabReportes';
import { useTransporteStore, init } from './store';
import { seedClientes, seedConductores, seedVehiculos, seedOrdenes, seedGuias, seedFacturas, seedUsuarios } from './mockData';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export default function TransporteCargaPage() {
  const state = useTransporteStore();
  const [role, setRole] = useState<'admin' | 'operador' | 'conductor'>('admin');

  useEffect(() => {
    if (state.clientes.length === 0) {
      init({
        clientes: seedClientes,
        conductores: seedConductores,
        vehiculos: seedVehiculos,
        ordenes: seedOrdenes,
        guias: seedGuias,
        facturas: seedFacturas,
        usuarios: seedUsuarios,
      });
    }
  }, []);

  const handleAddCliente = (cliente: any) => {
    const newCliente = { ...cliente, id: uuidv4(), createdAt: new Date() };
    const { clientes } = state;
    const { setState } = require('./store');
    setState({ clientes: [...clientes, newCliente] });
  };

  const handleUpdateCliente = (id: string, data: any) => {
    const { clientes } = state;
    const { setState } = require('./store');
    setState({
      clientes: clientes.map((c: any) => (c.id === id ? { ...c, ...data } : c)),
    });
  };

  const handleDeleteCliente = (id: string) => {
    const { clientes } = state;
    const { setState } = require('./store');
    setState({ clientes: clientes.filter((c: any) => c.id !== id) });
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      content: <div className="p-4">Dashboard coming soon...</div>,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      content: (
        <TabClientes
          clientes={state.clientes}
          onAddCliente={handleAddCliente}
          onUpdateCliente={handleUpdateCliente}
          onDeleteCliente={handleDeleteCliente}
        />
      ),
    },
    {
      id: 'ordenes',
      label: 'Ordenes',
      content: (
        <TabOrdenes
          ordenes={state.ordenes}
          onCreateOrden={() => {}}
          onUpdateOrden={() => {}}
        />
      ),
    },
    {
      id: 'guias',
      label: 'Guias',
      content: <TabGuias guias={state.guias} onAnularGuia={() => {}} />,
    },
    {
      id: 'facturas',
      label: 'Facturas',
      content: <TabFacturas facturas={state.facturas} onAnularFactura={() => {}} />,
    },
    {
      id: 'reportes',
      label: 'Reportes',
      content: (
        <TabReportes
          ordenes={state.ordenes}
          facturas={state.facturas}
          vehiculos={state.vehiculos}
          conductores={state.conductores}
          clientes={state.clientes}
        />
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Topbar title="Sistema de Transporte y Carga" role={role} onRoleChange={setRole} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Tabs items={tabs} />
        </main>
      </div>
    </div>
  );
}
