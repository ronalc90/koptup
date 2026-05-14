'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FileDropZoneProps {
  onFilesAdded?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
}

interface QueuedFile {
  id: string;
  file: File;
  progress: number;
}

const DEFAULT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.html,.json,.png,.jpg,.jpeg,.gif,.svg,.webp,.mp3,.mp4,.zip,.tar,.gz,*';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function FileDropZone({
  onFilesAdded,
  accept = DEFAULT_ACCEPT,
  multiple = true,
  label,
  hint,
}: FileDropZoneProps) {
  const [items, setItems] = useState<QueuedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFiles = useCallback(
    (files: FileList | File[]) => {
      const array = Array.from(files);
      if (!array.length) return;
      const queued: QueuedFile[] = array.map((file) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        file,
        progress: 0,
      }));
      setItems((prev) => [...prev, ...queued]);
      onFilesAdded?.(array);
    },
    [onFilesAdded],
  );

  useEffect(() => {
    const pendings = items.filter((i) => i.progress < 100);
    if (!pendings.length) return;
    const timer = setInterval(() => {
      setItems((prev) =>
        prev.map((i) => (i.progress < 100 ? { ...i, progress: Math.min(100, i.progress + 12) } : i)),
      );
    }, 180);
    return () => clearInterval(timer);
  }, [items]);

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files) acceptFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40'
            : 'border-secondary-300 bg-secondary-50 hover:border-primary-400 hover:bg-primary-50/40 dark:border-secondary-700 dark:bg-secondary-900 dark:hover:bg-secondary-800'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files) acceptFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <CloudArrowUpIcon className="mb-3 h-10 w-10 text-primary-600 dark:text-primary-400" />
        <div className="text-sm font-medium text-secondary-900 dark:text-white">
          {label ?? 'Arrastrá archivos aquí o hacé clic para seleccionarlos'}
        </div>
        {hint && (
          <div className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{hint}</div>
        )}
      </label>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-lg border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-900"
            >
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium text-secondary-900 dark:text-white">
                  {it.file.name}
                </div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400">
                  {formatBytes(it.file.size)} · {it.progress >= 100 ? 'Listo' : `Cargando ${it.progress}%`}
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                aria-label="Quitar archivo"
                className="rounded-md p-1.5 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
