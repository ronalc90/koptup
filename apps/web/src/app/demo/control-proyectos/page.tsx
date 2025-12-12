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
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, BellAlertIcon } from '@heroicons/react/24/solid';

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: 'alta' | 'media' | 'baja';
  tags: string[];
  column: string;
  comments: Comment[];
  attachments: number;
  checklist: { item: string; done: boolean }[];
}

interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

interface Project {
  id: number;
  name: string;
  color: string;
  favorite: boolean;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function ControlProyectos() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<'board' | 'project' | 'calendar' | 'favorites' | 'notifications' | 'settings'>('board');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [taskMenuOpen, setTaskMenuOpen] = useState<number | null>(null);

  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: 'Desarrollo Web', color: 'bg-blue-500', favorite: true },
    { id: 2, name: 'Marketing Digital', color: 'bg-green-500', favorite: false },
    { id: 3, name: 'Diseño UI/UX', color: 'bg-purple-500', favorite: true },
    { id: 4, name: 'App Mobile', color: 'bg-orange-500', favorite: false },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'Nueva tarea asignada', message: 'Carlos R. te asignó "Implementar API REST"', time: 'Hace 2 horas', read: false },
    { id: 2, title: 'Comentario nuevo', message: 'María G. comentó en "Diseñar Homepage"', time: 'Hace 4 horas', read: false },
    { id: 3, title: 'Tarea completada', message: 'Pedro L. completó "Testing de Integración"', time: 'Hace 1 día', read: true },
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
      comments: [
        { id: 1, author: 'María G.', text: 'Iniciando con los wireframes', timestamp: 'Hace 3 horas' }
      ],
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
      comments: [
        { id: 1, author: 'Carlos R.', text: 'Ya terminé los endpoints de usuarios, ahora voy con productos.', timestamp: 'Hace 2 horas' }
      ],
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
      comments: [],
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
      comments: [],
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
      comments: [],
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
      comments: [],
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

  const toggleFavorite = (projectId: number) => {
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, favorite: !p.favorite } : p
    ));
  };

  const addNewProject = (name: string, color: string) => {
    const newProject: Project = {
      id: projects.length + 1,
      name,
      color,
      favorite: false,
    };
    setProjects([...projects, newProject]);
    setShowNewProjectModal(false);
  };

  const addNewTask = (columnId: string, title: string, description: string) => {
    const newTask: Task = {
      id: tasks.length + 1,
      title,
      description,
      assignee: 'Sin asignar',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'media',
      tags: [],
      column: columnId,
      comments: [],
      attachments: 0,
      checklist: [],
    };
    setTasks([...tasks, newTask]);
    setShowNewTaskModal(null);
  };

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setTaskMenuOpen(null);
    setSelectedTask(null);
  };

  const duplicateTask = (task: Task) => {
    const newTask: Task = {
      ...task,
      id: tasks.length + 1,
      title: `${task.title} (copia)`,
    };
    setTasks([...tasks, newTask]);
    setTaskMenuOpen(null);
  };

  const toggleChecklistItem = (taskId: number, itemIndex: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newChecklist = [...task.checklist];
        newChecklist[itemIndex] = { ...newChecklist[itemIndex], done: !newChecklist[itemIndex].done };
        return { ...task, checklist: newChecklist };
      }
      return task;
    }));

    if (selectedTask && selectedTask.id === taskId) {
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        const newChecklist = [...updatedTask.checklist];
        newChecklist[itemIndex] = { ...newChecklist[itemIndex], done: !newChecklist[itemIndex].done };
        setSelectedTask({ ...updatedTask, checklist: newChecklist });
      }
    }
  };

  const addComment = () => {
    if (!selectedTask || !newComment.trim()) return;

    const comment: Comment = {
      id: selectedTask.comments.length + 1,
      author: 'Usuario Actual',
      text: newComment,
      timestamp: 'Justo ahora',
    };

    setTasks(tasks.map(task =>
      task.id === selectedTask.id
        ? { ...task, comments: [...task.comments, comment] }
        : task
    ));

    setSelectedTask({
      ...selectedTask,
      comments: [...selectedTask.comments, comment],
    });

    setNewComment('');
  };

  const markNotificationAsRead = (notifId: number) => {
    setNotifications(notifications.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    ));
  };

  // Notifications View
  if (view === 'notifications') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView('board')}
            className="text-teal-600 dark:text-teal-400 hover:underline mb-6"
          >
            ← Volver al tablero
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notificaciones</h2>
              <button
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
              >
                Marcar todas como leídas
              </button>
            </div>

            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    notif.read
                      ? 'bg-slate-50 dark:bg-slate-800'
                      : 'bg-teal-50 dark:bg-teal-950 border-l-4 border-teal-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <BellAlertIcon className={`w-5 h-5 mt-0.5 ${notif.read ? 'text-slate-400' : 'text-teal-600'}`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-500">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Favorites View
  if (view === 'favorites') {
    const favoriteTasks = tasks.filter(t =>
      projects.find(p => p.favorite && p.name === 'Desarrollo Web') // Simplificado
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setView('board')}
            className="text-teal-600 dark:text-teal-400 hover:underline mb-6"
          >
            ← Volver al tablero
          </button>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Proyectos Favoritos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.filter(p => p.favorite).map((project) => (
              <div key={project.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${project.color} rounded-full`} />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{project.name}</h3>
                  </div>
                  <button
                    onClick={() => toggleFavorite(project.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <StarIconSolid className="w-6 h-6 text-yellow-500" />
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {tasks.filter(t => t.column !== 'done').length} tareas activas
                  </p>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${project.color} rounded-full transition-all`}
                      style={{ width: `${getTotalProgress()}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Settings View
  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView('board')}
            className="text-teal-600 dark:text-teal-400 hover:underline mb-6"
          >
            ← Volver al tablero
          </button>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Configuración</h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Proyectos</h3>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 ${project.color} rounded-full`} />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(project.id)}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {project.favorite ? (
                          <StarIconSolid className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <PencilIcon className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notificaciones</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Nuevas tareas asignadas</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-600 rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Comentarios en mis tareas</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-600 rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Tareas próximas a vencer</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-600 rounded" />
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Preferencias</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Vista predeterminada
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                    <option>Tablero Kanban</option>
                    <option>Vista de Proyecto</option>
                    <option>Calendario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Idioma
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                    <option>Español</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

            <button
              onClick={() => setShowNewProjectModal(true)}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
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
              <button
                onClick={() => setView('favorites')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <StarIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Favoritos</span>
              </button>
              <button
                onClick={() => setView('notifications')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Notificaciones</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setView('settings')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
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
                      <button
                        onClick={() => setShowNewTaskModal(column.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      >
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
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id);
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              >
                                <EllipsisVerticalIcon className="w-5 h-5 text-slate-400" />
                              </button>

                              {taskMenuOpen === task.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateTask(task);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                    Duplicar
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(task.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
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
                              {task.comments.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                  <span>{task.comments.length}</span>
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

      {/* New Project Modal */}
      {showNewProjectModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowNewProjectModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Nuevo Proyecto</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addNewProject(
                  formData.get('name') as string,
                  formData.get('color') as string
                );
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nombre del proyecto
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Ej: Desarrollo Web"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Color
                    </label>
                    <select
                      name="color"
                      required
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="bg-blue-500">Azul</option>
                      <option value="bg-green-500">Verde</option>
                      <option value="bg-purple-500">Morado</option>
                      <option value="bg-orange-500">Naranja</option>
                      <option value="bg-red-500">Rojo</option>
                      <option value="bg-pink-500">Rosa</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all"
                  >
                    Crear Proyecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowNewTaskModal(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Nueva Tarea</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addNewTask(
                  showNewTaskModal,
                  formData.get('title') as string,
                  formData.get('description') as string
                );
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Ej: Implementar login"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Describe la tarea..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(null)}
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all"
                  >
                    Crear Tarea
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

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
                        onChange={() => toggleChecklistItem(selectedTask.id, i)}
                        className="w-5 h-5 text-teal-600 rounded cursor-pointer"
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
                  Comentarios ({selectedTask.comments.length})
                </h3>
                <div className="space-y-3">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold">
                          {comment.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.author}</span>
                            <span className="text-xs text-slate-500">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Agregar un comentario..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows={3}
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="mt-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Agregar Comentario
                  </button>
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
                        <span className="font-semibold">{selectedTask.assignee}</span> movió esta tarea a{' '}
                        <span className="font-semibold">{columns.find(c => c.id === selectedTask.column)?.title}</span>
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
