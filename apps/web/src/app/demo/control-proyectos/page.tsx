'use client';

import { useState } from 'react';
import {
  RectangleStackIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  StarIcon,
  BellIcon,
  Cog6ToothIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: 'alta' | 'media' | 'baja';
  tags: string[];
  column: string;
  comments: number;
  attachments: number;
  checklist: { item: string; done: boolean }[];
}

interface Project {
  id: number;
  name: string;
  color: string;
  favorite: boolean;
}

export default function ControlProyectos() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<'board' | 'project' | 'calendar'>('board');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const [projects] = useState<Project[]>([
    { id: 1, name: 'Desarrollo Web', color: 'bg-blue-500', favorite: true },
    { id: 2, name: 'Marketing Digital', color: 'bg-green-500', favorite: false },
    { id: 3, name: 'Diseño UI/UX', color: 'bg-purple-500', favorite: true },
    { id: 4, name: 'App Mobile', color: 'bg-orange-500', favorite: false },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Diseñar Homepage',
      description: 'Crear diseño responsivo para la página principal',
      assignee: 'María G.',
      dueDate: '2024-02-05',
      priority: 'alta',
      tags: ['Diseño', 'Frontend'],
      column: 'todo',
      comments: 3,
      attachments: 2,
      checklist: [
        { item: 'Wireframes aprobados', done: true },
        { item: 'Mockups en Figma', done: true },
        { item: 'Revisión con cliente', done: false },
      ],
    },
    {
      id: 2,
      title: 'Implementar API REST',
      description: 'Desarrollar endpoints para usuarios y productos',
      assignee: 'Carlos R.',
      dueDate: '2024-02-03',
      priority: 'alta',
      tags: ['Backend', 'API'],
      column: 'progress',
      comments: 5,
      attachments: 1,
      checklist: [
        { item: 'Diseño de base de datos', done: true },
        { item: 'Endpoints CRUD usuarios', done: true },
        { item: 'Endpoints CRUD productos', done: false },
        { item: 'Documentación API', done: false },
      ],
    },
    {
      id: 3,
      title: 'Configurar CI/CD',
      description: 'Setup de pipeline para deploy automático',
      assignee: 'Ana M.',
      dueDate: '2024-02-01',
      priority: 'media',
      tags: ['DevOps', 'Deploy'],
      column: 'progress',
      comments: 2,
      attachments: 0,
      checklist: [
        { item: 'GitHub Actions configurado', done: true },
        { item: 'Tests automáticos', done: false },
      ],
    },
    {
      id: 4,
      title: 'Testing de Integración',
      description: 'Pruebas end-to-end del flujo de compra',
      assignee: 'Pedro L.',
      dueDate: '2024-02-06',
      priority: 'media',
      tags: ['Testing', 'QA'],
      column: 'review',
      comments: 1,
      attachments: 1,
      checklist: [
        { item: 'Casos de prueba definidos', done: true },
        { item: 'Ejecución de tests', done: true },
        { item: 'Reporte de bugs', done: false },
      ],
    },
    {
      id: 5,
      title: 'Documentación Usuario',
      description: 'Manual de usuario para nuevas funcionalidades',
      assignee: 'Laura F.',
      dueDate: '2024-01-30',
      priority: 'baja',
      tags: ['Docs', 'UX'],
      column: 'done',
      comments: 0,
      attachments: 3,
      checklist: [
        { item: 'Guía de inicio rápido', done: true },
        { item: 'Tutoriales en video', done: true },
        { item: 'FAQs', done: true },
      ],
    },
    {
      id: 6,
      title: 'Optimizar Rendimiento',
      description: 'Mejorar velocidad de carga de la aplicación',
      assignee: 'María G.',
      dueDate: '2024-02-08',
      priority: 'alta',
      tags: ['Performance', 'Frontend'],
      column: 'todo',
      comments: 4,
      attachments: 0,
      checklist: [
        { item: 'Análisis de performance', done: false },
        { item: 'Lazy loading de imágenes', done: false },
        { item: 'Code splitting', done: false },
      ],
    },
  ]);

  const columns = [
    { id: 'todo', title: 'Por Hacer', color: 'bg-slate-200 dark:bg-slate-800' },
    { id: 'progress', title: 'En Progreso', color: 'bg-blue-200 dark:bg-blue-950' },
    { id: 'review', title: 'En Revisión', color: 'bg-yellow-200 dark:bg-yellow-950' },
    { id: 'done', title: 'Terminado', color: 'bg-green-200 dark:bg-green-950' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      case 'media':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
      case 'baja':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (draggedTask) {
      setTasks(tasks.map(task =>
        task.id === draggedTask.id ? { ...task, column: columnId } : task
      ));
      setDraggedTask(null);
    }
  };

  const getTaskProgress = (task: Task) => {
    const total = task.checklist.length;
    const done = task.checklist.filter(item => item.done).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const getTotalProgress = () => {
    const doneTasks = tasks.filter(t => t.column === 'done').length;
    return Math.round((doneTasks / tasks.length) * 100);
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate < today && t.column !== 'done';
    });
  };

  if (view === 'project') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setView('board')}
            className="text-teal-600 dark:text-teal-400 hover:underline mb-6"
          >
            ← Volver al tablero
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Progress Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Progreso Total
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${getTotalProgress() * 3.52} 352`}
                      className="text-teal-600"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {getTotalProgress()}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
                {tasks.filter(t => t.column === 'done').length} de {tasks.length} tareas completadas
              </p>
            </div>

            {/* Overdue Tasks */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Tareas Atrasadas
              </h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-red-600 mb-2">
                  {getOverdueTasks().length}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Requieren atención inmediata
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {getOverdueTasks().slice(0, 3).map((task) => (
                  <div key={task.id} className="p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {task.title}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Vencía: {task.dueDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Estadísticas
              </h3>
              <div className="space-y-4">
                {columns.map((col) => (
                  <div key={col.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {col.title}
                      </span>
                      <span className="text-sm font-semibold">
                        {tasks.filter(t => t.column === col.id).length}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all"
                        style={{
                          width: `${(tasks.filter(t => t.column === col.id).length / tasks.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Calendario de Deadlines
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-slate-500 py-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 2;
                const hasDeadline = tasks.some(t => new Date(t.dueDate).getDate() === day + 1);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                      day < 0
                        ? 'invisible'
                        : hasDeadline
                        ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {day >= 0 && day + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Board View
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <RectangleStackIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">ProyectHub</span>
            </div>

            <button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg flex items-center justify-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Nuevo Proyecto
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-3">
                Proyectos
              </h3>
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${project.color} rounded-full`} />
                    <span className="text-sm font-medium">{project.name}</span>
                  </div>
                  {project.favorite && <StarIconSolid className="w-4 h-4 text-yellow-500" />}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                <StarIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Favoritos</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Notificaciones</span>
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                <Cog6ToothIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Configuración</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Desarrollo Web
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {tasks.length} tareas • {getTotalProgress()}% completado
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('project')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <ChartPieIcon className="w-5 h-5" />
                  Vista de Proyecto
                </button>
                <div className="flex -space-x-2">
                  {['MG', 'CR', 'AM', 'PL'].map((initials, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-semibold text-sm border-2 border-white dark:border-slate-900"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* Kanban Board */}
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-6 h-full">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="flex-shrink-0 w-80 flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {column.title}
                        <span className="text-sm font-normal text-slate-500">
                          {tasks.filter(t => t.column === column.id).length}
                        </span>
                      </h2>
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                        <PlusIcon className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                    <div className={`h-1 ${column.color} rounded-full`} />
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasks
                      .filter(task => task.column === column.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white dark:bg-slate-900 rounded-xl shadow-md hover:shadow-xl transition-all cursor-move p-4 border-2 border-transparent hover:border-teal-500"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex-1">
                              {task.title}
                            </h3>
                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                              <EllipsisVerticalIcon className="w-5 h-5 text-slate-400" />
                            </button>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 rounded text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {task.checklist.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span>Progreso</span>
                                <span>{getTaskProgress(task)}%</span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-600 rounded-full transition-all"
                                  style={{ width: `${getTaskProgress(task)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-500 text-sm">
                              {task.comments > 0 && (
                                <div className="flex items-center gap-1">
                                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                  <span>{task.comments}</span>
                                </div>
                              )}
                              {task.attachments > 0 && (
                                <div className="flex items-center gap-1">
                                  <PaperClipIcon className="w-4 h-4" />
                                  <span>{task.attachments}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold">
                                {task.assignee.split(' ').map(n => n[0]).join('')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedTask(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {selectedTask.title}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>En {columns.find(c => c.id === selectedTask.column)?.title}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Descripción</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-1">Asignado a</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold">
                      {selectedTask.assignee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium">{selectedTask.assignee}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-1">Fecha límite</h4>
                  <p className="font-medium">{selectedTask.dueDate}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-1">Prioridad</h4>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-1">Etiquetas</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  Checklist ({selectedTask.checklist.filter(item => item.done).length}/{selectedTask.checklist.length})
                </h3>
                <div className="space-y-2">
                  {selectedTask.checklist.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        readOnly
                        className="w-5 h-5 text-teal-600 rounded"
                      />
                      <span className={item.done ? 'line-through text-slate-400' : ''}>
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  Comentarios ({selectedTask.comments})
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold">
                        CR
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">Carlos R.</span>
                          <span className="text-xs text-slate-500">Hace 2 horas</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Ya terminé los endpoints de usuarios, ahora voy con productos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <textarea
                    placeholder="Agregar un comentario..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  Archivos Adjuntos ({selectedTask.attachments})
                </h3>
                {selectedTask.attachments > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
                    <PaperClipIcon className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">diagrama-api.pdf</p>
                      <p className="text-xs text-slate-500">245 KB</p>
                    </div>
                    <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                      Descargar
                    </button>
                  </div>
                )}
              </div>

              {/* Activity History */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Historial de Cambios</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-600 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">Carlos R.</span> movió esta tarea a{' '}
                        <span className="font-semibold">En Progreso</span>
                      </p>
                      <p className="text-xs text-slate-500">Hace 3 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-400 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">María G.</span> creó esta tarea
                      </p>
                      <p className="text-xs text-slate-500">Hace 1 día</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
