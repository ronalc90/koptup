'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  BellIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  HomeIcon,
  CreditCardIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

type ViewType = 'dashboard' | 'finanzas' | 'clientes' | 'configuracion' | 'notificaciones';

export default function DashboardEjecutivo() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState('Enero 2024');
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  // Estados de configuración
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoExport, setAutoExport] = useState(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Estados para búsqueda y notificaciones
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Estados para modales de notificaciones
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Cargar preferencias desde localStorage al montar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedEmailNotif = localStorage.getItem('emailNotifications') !== 'false';
    const savedAutoExport = localStorage.getItem('autoExport') !== 'false';

    setDarkMode(savedDarkMode);
    setEmailNotifications(savedEmailNotif);
    setAutoExport(savedAutoExport);
  }, []);

  // Aplicar dark mode al documento
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Función para guardar cambios
  const handleSaveChanges = () => {
    localStorage.setItem('darkMode', darkMode.toString());
    localStorage.setItem('emailNotifications', emailNotifications.toString());
    localStorage.setItem('autoExport', autoExport.toString());

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Datos KPI
  const kpis = [
    {
      id: 1,
      title: 'Ingresos del Mes',
      value: '$1,245,890',
      change: '+12.5%',
      isPositive: true,
      icon: CurrencyDollarIcon,
      color: 'from-green-500 to-emerald-600',
      description: 'vs mes anterior',
    },
    {
      id: 2,
      title: 'Nuevos Clientes',
      value: '1,284',
      change: '+8.2%',
      isPositive: true,
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-600',
      description: 'este mes',
    },
    {
      id: 3,
      title: 'Retención',
      value: '94.8%',
      change: '-2.1%',
      isPositive: false,
      icon: UserGroupIcon,
      color: 'from-purple-500 to-purple-600',
      description: 'tasa de retención',
    },
    {
      id: 4,
      title: 'Margen Neto',
      value: '32.4%',
      change: '+5.3%',
      isPositive: true,
      icon: ChartBarIcon,
      color: 'from-orange-500 to-orange-600',
      description: 'margen promedio',
    },
  ];

  // Datos para gráfico de líneas (Ingresos)
  const revenueData = [
    { month: 'Ene', ingresos: 85, gastos: 62 },
    { month: 'Feb', ingresos: 92, gastos: 68 },
    { month: 'Mar', ingresos: 105, gastos: 72 },
    { month: 'Abr', ingresos: 98, gastos: 70 },
    { month: 'May', ingresos: 112, gastos: 75 },
    { month: 'Jun', ingresos: 125, gastos: 84 },
  ];

  // Datos para gráfico de barras (Desempeño por área)
  const performanceData = [
    { area: 'Ventas', desempeño: 92 },
    { area: 'Marketing', desempeño: 85 },
    { area: 'Soporte', desempeño: 88 },
    { area: 'Producto', desempeño: 95 },
    { area: 'Operaciones', desempeño: 78 },
  ];

  // Datos para gráfico donut (Distribución de ventas)
  const salesDistribution = [
    { name: 'Producto A', value: 35, color: '#8b5cf6' },
    { name: 'Producto B', value: 28, color: '#3b82f6' },
    { name: 'Producto C', value: 22, color: '#10b981' },
    { name: 'Producto D', value: 15, color: '#f59e0b' },
  ];

  // Insights inteligentes
  const insights = [
    {
      type: 'trend',
      icon: ArrowTrendingUpIcon,
      title: 'Tendencia Positiva',
      description: 'Los ingresos han crecido consistentemente en los últimos 3 meses, con un aumento promedio del 8.5% mensual.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      type: 'alert',
      icon: ExclamationTriangleIcon,
      title: 'Alerta de Retención',
      description: 'La tasa de retención ha disminuido 2.1%. Se recomienda implementar estrategias de fidelización.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      type: 'recommendation',
      icon: LightBulbIcon,
      title: 'Recomendación Ejecutiva',
      description: 'El Producto A está generando el 35% de las ventas. Considere aumentar inventario y esfuerzos de marketing en esta línea.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  // Datos de Finanzas
  const transacciones = [
    { id: 1, fecha: '2024-01-28', concepto: 'Venta Producto A - Cliente ABC', monto: 125000, tipo: 'ingreso' },
    { id: 2, fecha: '2024-01-28', concepto: 'Pago Nómina Enero', monto: -450000, tipo: 'egreso' },
    { id: 3, fecha: '2024-01-27', concepto: 'Venta Servicio Premium', monto: 89500, tipo: 'ingreso' },
    { id: 4, fecha: '2024-01-27', concepto: 'Pago Proveedor XYZ', monto: -67000, tipo: 'egreso' },
    { id: 5, fecha: '2024-01-26', concepto: 'Factura Cliente DEF', monto: 234000, tipo: 'ingreso' },
    { id: 6, fecha: '2024-01-26', concepto: 'Servicios Públicos', monto: -12500, tipo: 'egreso' },
    { id: 7, fecha: '2024-01-25', concepto: 'Venta Producto B', monto: 78000, tipo: 'ingreso' },
    { id: 8, fecha: '2024-01-25', concepto: 'Material de Oficina', monto: -8900, tipo: 'egreso' },
  ];

  // Datos de Clientes
  const clientes = [
    { id: 1, nombre: 'TechCorp Solutions', contacto: 'María González', email: 'maria@techcorp.com', telefono: '+57 300 123 4567', estado: 'activo', valor: '$450,000' },
    { id: 2, nombre: 'Innovate SA', contacto: 'Carlos Rodríguez', email: 'carlos@innovate.com', telefono: '+57 310 234 5678', estado: 'activo', valor: '$325,000' },
    { id: 3, nombre: 'Digital Partners', contacto: 'Ana Martínez', email: 'ana@digital.com', telefono: '+57 320 345 6789', estado: 'activo', valor: '$580,000' },
    { id: 4, nombre: 'CloudFirst Inc', contacto: 'Pedro López', email: 'pedro@cloudfirst.com', telefono: '+57 315 456 7890', estado: 'inactivo', valor: '$120,000' },
    { id: 5, nombre: 'DataSystems Pro', contacto: 'Laura Fernández', email: 'laura@datasys.com', telefono: '+57 305 567 8901', estado: 'activo', valor: '$890,000' },
    { id: 6, nombre: 'AppDev Studios', contacto: 'Jorge Ramírez', email: 'jorge@appdev.com', telefono: '+57 318 678 9012', estado: 'activo', valor: '$275,000' },
  ];

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'finanzas', name: 'Finanzas', icon: CreditCardIcon },
    { id: 'clientes', name: 'Clientes', icon: UserGroupIcon },
    { id: 'configuracion', name: 'Configuración', icon: Cog6ToothIcon },
  ];

  const renderDashboardView = () => (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${kpi.color}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-br ${kpi.color} rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      kpi.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {kpi.isPositive ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-semibold">{kpi.change}</span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {kpi.value}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{kpi.title}</p>
                <p className="text-xs text-slate-400">{kpi.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Line Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Ingresos por Mes
          </h3>
          <div className="h-80">
            <svg viewBox="0 0 600 300" className="w-full h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="50"
                  y1={50 + i * 50}
                  x2="550"
                  y2={50 + i * 50}
                  stroke="#e2e8f0"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Y-axis labels */}
              {[125, 100, 75, 50, 25, 0].map((val, i) => (
                <text key={i} x="30" y={55 + i * 50} fill="#64748b" fontSize="12">
                  {val}k
                </text>
              ))}

              {/* X-axis labels */}
              {revenueData.map((data, i) => (
                <text key={i} x={85 + i * 80} y="280" fill="#64748b" fontSize="12">
                  {data.month}
                </text>
              ))}

              {/* Ingresos line */}
              <polyline
                points={revenueData
                  .map((d, i) => `${100 + i * 80},${250 - d.ingresos * 1.6}`)
                  .join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
              />
              {revenueData.map((d, i) => (
                <circle
                  key={i}
                  cx={100 + i * 80}
                  cy={250 - d.ingresos * 1.6}
                  r="5"
                  fill="#8b5cf6"
                />
              ))}

              {/* Gastos line */}
              <polyline
                points={revenueData
                  .map((d, i) => `${100 + i * 80},${250 - d.gastos * 1.6}`)
                  .join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
              />
              {revenueData.map((d, i) => (
                <circle
                  key={i}
                  cx={100 + i * 80}
                  cy={250 - d.gastos * 1.6}
                  r="5"
                  fill="#f59e0b"
                />
              ))}

              {/* Legend */}
              <circle cx="200" cy="20" r="5" fill="#8b5cf6" />
              <text x="210" y="25" fill="#64748b" fontSize="12">
                Ingresos
              </text>
              <circle cx="300" cy="20" r="5" fill="#f59e0b" />
              <text x="310" y="25" fill="#64748b" fontSize="12">
                Gastos
              </text>
            </svg>
          </div>
        </div>

        {/* Performance Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Desempeño por Área
          </h3>
          <div className="h-80">
            <svg viewBox="0 0 600 300" className="w-full h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="50"
                  y1={50 + i * 50}
                  x2="550"
                  y2={50 + i * 50}
                  stroke="#e2e8f0"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Y-axis labels */}
              {[100, 80, 60, 40, 20, 0].map((val, i) => (
                <text key={i} x="20" y={55 + i * 50} fill="#64748b" fontSize="12">
                  {val}
                </text>
              ))}

              {/* Bars */}
              {performanceData.map((data, i) => (
                <g key={i}>
                  <rect
                    x={80 + i * 90}
                    y={250 - data.desempeño * 2}
                    width="60"
                    height={data.desempeño * 2}
                    fill="#3b82f6"
                    rx="8"
                  />
                  <text x={85 + i * 90} y="280" fill="#64748b" fontSize="11">
                    {data.area}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Sales Distribution and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Distribución de Ventas por Categoría
          </h3>
          <div className="flex items-center justify-center mb-6">
            <svg viewBox="0 0 200 200" className="w-64 h-64">
              {/* Donut segments */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="40"
                strokeDasharray="175.93 351.86"
                strokeDashoffset="0"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="40"
                strokeDasharray="146.61 351.86"
                strokeDashoffset="-175.93"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#10b981"
                strokeWidth="40"
                strokeDasharray="115.19 351.86"
                strokeDashoffset="-322.54"
                transform="rotate(-90 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="40"
                strokeDasharray="78.54 351.86"
                strokeDashoffset="-437.73"
                transform="rotate(-90 100 100)"
              />
              {/* Center hole */}
              <circle cx="100" cy="100" r="60" fill="white" className="dark:fill-slate-900" />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {salesDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Insights Inteligentes
            </h3>
          </div>
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={index}
                  className={`p-4 ${insight.bgColor} dark:bg-slate-800 rounded-xl`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-white dark:bg-slate-700 rounded-lg ${insight.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${insight.color}`}>
                        {insight.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  const renderFinanzasView = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-xl">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Ingresos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">$526,500</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-950 rounded-xl">
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Egresos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">$538,400</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-xl">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Balance Neto</p>
              <h3 className="text-2xl font-bold text-red-600">-$11,900</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Transacciones Recientes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Concepto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {transacciones.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tx.fecha}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{tx.concepto}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      tx.tipo === 'ingreso'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                    }`}>
                      {tx.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-bold ${
                    tx.monto > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.monto > 0 ? '+' : ''}{tx.monto.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderClientesView = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Base de Clientes
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Total: {clientes.length} clientes</span>
            <span className="text-sm text-green-600 font-semibold">{clientes.filter(c => c.estado === 'activo').length} activos</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="border-2 border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-purple-500 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {cliente.nombre.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{cliente.nombre}</h4>
                  <p className="text-sm text-slate-500">{cliente.contacto}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                cliente.estado === 'activo'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <EnvelopeIcon className="w-4 h-4" />
                <span>{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <PhoneIcon className="w-4 h-4" />
                <span>{cliente.telefono}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Valor Total</span>
                <span className="text-lg font-bold text-purple-600">{cliente.valor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConfiguracionView = () => (
    <div className="space-y-6">
      {/* Mensaje de éxito */}
      {showSaveSuccess && (
        <div className="bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 dark:text-green-400">Cambios guardados exitosamente</h4>
            <p className="text-sm text-green-600 dark:text-green-500">Tus preferencias han sido actualizadas</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Configuración de la Empresa
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              defaultValue="KopTup Tech Solutions"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              NIT / RUT
            </label>
            <input
              type="text"
              defaultValue="900.123.456-7"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Corporativo
            </label>
            <input
              type="email"
              defaultValue="contacto@koptup.com"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              defaultValue="+57 (1) 234 5678"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              defaultValue="Calle 100 #20-50, Bogotá, Colombia"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Preferencias del Sistema
        </h3>
        <div className="space-y-4">
          {/* Toggle Notificaciones por Email */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Notificaciones por Email</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Recibir alertas y reportes por correo</p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle Modo Oscuro */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Modo Oscuro</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Interfaz con tema oscuro</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle Exportación Automática */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Exportación Automática</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generar reportes mensuales automáticamente</p>
            </div>
            <button
              onClick={() => setAutoExport(!autoExport)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoExport ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoExport ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            // Recargar desde localStorage para deshacer cambios
            const savedDarkMode = localStorage.getItem('darkMode') === 'true';
            const savedEmailNotif = localStorage.getItem('emailNotifications') !== 'false';
            const savedAutoExport = localStorage.getItem('autoExport') !== 'false';

            setDarkMode(savedDarkMode);
            setEmailNotifications(savedEmailNotif);
            setAutoExport(savedAutoExport);
          }}
          className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveChanges}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );

  const renderNotificacionesView = () => (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Todas las Notificaciones
      </h2>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nuevo reporte financiero disponible
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                El reporte financiero del mes de enero ya está listo para revisión. Incluye análisis de ventas, gastos y proyecciones.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hace 5 minutos</span>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Ver Reporte
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Meta de ventas alcanzada
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                ¡Felicitaciones! El equipo de ventas ha superado la meta mensual con un 15% de incremento respecto al mes anterior.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hace 1 hora</span>
                <button
                  onClick={() => setShowSalesDetailModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Actualización de sistema programada
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Se realizará un mantenimiento del sistema el próximo sábado de 2:00 AM a 6:00 AM. El servicio estará temporalmente no disponible.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hace 2 horas</span>
                <button
                  onClick={() => setShowMaintenanceModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Más Información
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nuevo cliente registrado
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Un nuevo cliente se ha registrado en la plataforma: Empresa ABC S.A. - Plan Enterprise.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hace 3 horas</span>
                <button
                  onClick={() => setShowClientModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Ver Cliente
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border-l-4 border-slate-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Reunión de equipo programada
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Recordatorio: Reunión trimestral de equipo mañana a las 10:00 AM en la sala de conferencias principal.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Hace 5 horas</span>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  Agregar al Calendario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <span className="font-bold text-xl">KopTup</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeView === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                      : 'hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header
          className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0"
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            zIndex: 10
          }}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Hamburger Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Bars3Icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>

              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(e.target.value.length > 0);
                    }}
                    onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto" style={{ zIndex: 9999 }}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            Resultados de búsqueda
                          </h3>
                          <button
                            onClick={() => {
                              setShowSearchResults(false);
                              setSearchQuery('');
                            }}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        {searchQuery.trim() === '' ? (
                          <p className="text-sm text-slate-500">Escribe para buscar...</p>
                        ) : (
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setActiveView('dashboard');
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-left"
                            >
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                Dashboard Principal
                              </div>
                              <div className="text-xs text-slate-500">Vista principal con métricas</div>
                            </button>
                            <button
                              onClick={() => {
                                setActiveView('finanzas');
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-left"
                            >
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                Finanzas
                              </div>
                              <div className="text-xs text-slate-500">Gráficos y reportes financieros</div>
                            </button>
                            <button
                              onClick={() => {
                                setActiveView('clientes');
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-left"
                            >
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                Clientes
                              </div>
                              <div className="text-xs text-slate-500">Gestión de clientes</div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 ml-6">
                {/* Botón de modo oscuro rápido */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {darkMode ? (
                    <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700" style={{ zIndex: 9999 }}>
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            Notificaciones
                          </h3>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                Nuevo reporte financiero disponible
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Hace 5 minutos</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                Meta de ventas alcanzada
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Hace 1 hora</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                Actualización de sistema programada
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Hace 2 horas</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                Nuevo cliente registrado
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Hace 3 horas</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            setActiveView('notificaciones');
                          }}
                          className="w-full text-center text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
                        >
                          Ver todas las notificaciones
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option>Enero 2024</option>
                    <option>Febrero 2024</option>
                    <option>Marzo 2024</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">CEO</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Ejecutivo</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    JD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {activeView === 'dashboard' && renderDashboardView()}
          {activeView === 'finanzas' && renderFinanzasView()}
          {activeView === 'clientes' && renderClientesView()}
          {activeView === 'configuracion' && renderConfiguracionView()}
          {activeView === 'notificaciones' && renderNotificacionesView()}
        </main>
      </div>

      {/* Modal: Reporte Financiero */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Reporte Financiero - Enero 2024
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Resumen Ejecutivo */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumen Ejecutivo</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Ingresos Totales</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">$2,450,000</div>
                      <div className="text-xs text-green-600">↑ 23% vs. mes anterior</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Gastos Totales</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">$1,850,000</div>
                      <div className="text-xs text-red-600">↑ 12% vs. mes anterior</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Utilidad Neta</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">$600,000</div>
                      <div className="text-xs text-blue-600">↑ 45% vs. mes anterior</div>
                    </div>
                  </div>
                </div>

                {/* Análisis de Ventas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Análisis de Ventas</h3>
                  <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                    <li>• Ventas por productos: $1,450,000 (59%)</li>
                    <li>• Ventas por servicios: $780,000 (32%)</li>
                    <li>• Otros ingresos: $220,000 (9%)</li>
                    <li>• Clientes nuevos: 145 (+28%)</li>
                    <li>• Tasa de retención: 87%</li>
                  </ul>
                </div>

                {/* Gastos Operativos */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Gastos Operativos</h3>
                  <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                    <li>• Nómina: $980,000 (53%)</li>
                    <li>• Infraestructura: $420,000 (23%)</li>
                    <li>• Marketing: $280,000 (15%)</li>
                    <li>• Administrativos: $170,000 (9%)</li>
                  </ul>
                </div>

                {/* Proyecciones */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Proyecciones Febrero 2024</h3>
                  <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                    <li>• Ingresos proyectados: $2,680,000 (+9%)</li>
                    <li>• Utilidad estimada: $720,000 (+20%)</li>
                    <li>• Nuevos contratos esperados: 35</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                  >
                    Cerrar
                  </button>
                  <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Descargar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalles de Ventas */}
      {showSalesDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Meta de Ventas Alcanzada 🎉
                </h2>
                <button
                  onClick={() => setShowSalesDetailModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">115%</div>
                    <div className="text-lg text-slate-700 dark:text-slate-300">de la meta mensual</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Meta Establecida</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">$2,000,000</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Ventas Logradas</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">$2,300,000</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Top Vendedores</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                          1
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">María González</div>
                          <div className="text-sm text-slate-500">$580,000</div>
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold">+28%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white font-bold">
                          2
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">Carlos Ramírez</div>
                          <div className="text-sm text-slate-500">$520,000</div>
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold">+22%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center text-white font-bold">
                          3
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">Ana Martínez</div>
                          <div className="text-sm text-slate-500">$485,000</div>
                        </div>
                      </div>
                      <div className="text-green-600 font-semibold">+19%</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSalesDetailModal(false)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mantenimiento */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Mantenimiento Programado
                </h2>
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Atención</h3>
                      <p className="text-slate-700 dark:text-slate-300">El sistema no estará disponible durante el mantenimiento</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Detalles del Mantenimiento</h3>
                  <div className="space-y-3 text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <div className="font-semibold">Fecha</div>
                        <div>Sábado 3 de Febrero, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ClockIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <div className="font-semibold">Horario</div>
                        <div>2:00 AM - 6:00 AM (4 horas)</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Cog6ToothIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <div className="font-semibold">Tipo de Mantenimiento</div>
                        <div>Actualización de servidores y optimización de base de datos</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Recomendaciones</h4>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <li>• Guarda todo tu trabajo antes del mantenimiento</li>
                    <li>• Descarga los reportes que necesites</li>
                    <li>• Planifica tareas fuera del horario de mantenimiento</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cliente Nuevo */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Nuevo Cliente Registrado
                </h2>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      ABC
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Empresa ABC S.A.</h3>
                      <p className="text-slate-700 dark:text-slate-300">Plan Enterprise</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-slate-500" />
                      <div className="text-sm text-slate-600 dark:text-slate-400">Industria</div>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white">Tecnología</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <UsersIcon className="w-5 h-5 text-slate-500" />
                      <div className="text-sm text-slate-600 dark:text-slate-400">Empleados</div>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white">250-500</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Información de Contacto</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <EnvelopeIcon className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Email</div>
                        <div className="font-semibold text-slate-900 dark:text-white">contacto@empresaabc.com</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Teléfono</div>
                        <div className="font-semibold text-slate-900 dark:text-white">+57 300 123 4567</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Ubicación</div>
                        <div className="font-semibold text-slate-900 dark:text-white">Bogotá, Colombia</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Plan Enterprise</h4>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <li>• Usuarios ilimitados</li>
                    <li>• Almacenamiento: 5TB</li>
                    <li>• Soporte prioritario 24/7</li>
                    <li>• Integraciones personalizadas</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClientModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setShowClientModal(false);
                      setActiveView('clientes');
                    }}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  >
                    Ver en Clientes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar al Calendario */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Agregar al Calendario
                </h2>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reunión Trimestral de Equipo</h3>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-slate-500" />
                      <span>Mañana - 3 de Febrero, 2024</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-slate-500" />
                      <span>10:00 AM - 12:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-slate-500" />
                      <span>Sala de Conferencias Principal</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Agenda</h4>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <li>• Revisión de resultados Q1 2024</li>
                    <li>• Objetivos para Q2 2024</li>
                    <li>• Actualización de proyectos en curso</li>
                    <li>• Discusión de nuevas iniciativas</li>
                    <li>• Sesión de preguntas y respuestas</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Participantes</h4>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-900">
                      JD
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-900">
                      MG
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-900">
                      CR
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-900">
                      +12
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCalendarModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setShowCalendarModal(false);
                      alert('¡Evento agregado al calendario! 📅');
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-semibold"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
