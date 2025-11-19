'use client';

import { useState } from 'react';
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
  HomeIcon,
  CreditCardIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

export default function DashboardEjecutivo() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState('Enero 2024');

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

  const menuItems = [
    { name: 'Dashboard', icon: HomeIcon, active: true },
    { name: 'Finanzas', icon: CreditCardIcon, active: false },
    { name: 'Clientes', icon: UserGroupIcon, active: false },
    { name: 'Configuración', icon: Cog6ToothIcon, active: false },
  ];

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
                  key={item.name}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.active
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
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 ml-6">
                <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none"
                  >
                    <option>Enero 2024</option>
                    <option>Febrero 2024</option>
                    <option>Marzo 2024</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">CEO</div>
                    <div className="text-xs text-slate-500">Ejecutivo</div>
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
        </main>
      </div>
    </div>
  );
}
