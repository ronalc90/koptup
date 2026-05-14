/**
 * Tipos compartidos por la demo `control-proyectos` y sus sub-componentes.
 */

export interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

export interface Task {
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

export interface Project {
  id: number;
  name: string;
  color: string;
  favorite: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface Column {
  id: string;
  title: string;
  color: string;
}

export type ViewId =
  | 'kanban'
  | 'list'
  | 'gantt'
  | 'timeline'
  | 'calendar'
  | 'board'
  | 'mindmap'
  | 'swimlanes'
  | 'analytics'
  | 'wiki';
