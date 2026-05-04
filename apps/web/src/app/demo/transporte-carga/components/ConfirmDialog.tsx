'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Modal } from './Modal';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string | ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  children?: ReactNode;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'info',
  loading = false,
  children,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${config.bgColor} rounded-full p-3`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
          <div className="text-slate-600 dark:text-slate-300 mb-4">{description}</div>
          {children}
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${config.confirmButtonClass}`}
        >
          {loading ? 'Procesando...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
