'use client';

import { useState } from 'react';
import {
  HandThumbUpIcon,
  ChatBubbleOvalLeftIcon,
  ArrowPathRoundedSquareIcon,
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid } from '@heroicons/react/24/solid';

interface PostPreviewProps {
  texto: string;
  imagenUrl?: string | null;
  autorNombre?: string;
  autorTitulo?: string;
  autorSeguidores?: string;
}

/**
 * Vista previa fiel al feed de LinkedIn. Sirve para que el usuario vea
 * exactamente cómo se va a ver el post antes de copiar y pegar.
 */
export default function PostPreview({
  texto,
  imagenUrl,
  autorNombre = 'Koptup',
  autorTitulo = 'Desarrollo de Software a Medida · IA y Automatización',
  autorSeguidores = '19 seguidores',
}: PostPreviewProps) {
  const [expandido, setExpandido] = useState(false);
  const lineasCortas = texto.split('\n').slice(0, 3).join('\n');
  const necesitaExpansion = texto.split('\n').length > 3 || texto.length > 220;
  const textoMostrado = expandido || !necesitaExpansion ? texto : lineasCortas;

  return (
    <div className="max-w-[552px] rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
      <div className="flex items-start gap-2 px-4 pt-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-base font-bold text-white">
          K
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-secondary-900 dark:text-white">
            {autorNombre}
          </p>
          <p className="truncate text-xs text-secondary-500 dark:text-secondary-400">
            {autorTitulo}
          </p>
          <p className="mt-0.5 text-[11px] text-secondary-500 dark:text-secondary-400">
            {autorSeguidores}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-secondary-500 dark:text-secondary-400">
            Hace 2 h · <GlobeAltIcon className="h-3 w-3" />
          </p>
        </div>
        <button
          type="button"
          aria-label="Más opciones"
          className="rounded-full p-1 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pb-2 pt-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary-900 dark:text-secondary-100">
          {textoMostrado}
        </p>
        {necesitaExpansion && !expandido ? (
          <button
            type="button"
            onClick={() => setExpandido(true)}
            className="mt-1 text-sm font-medium text-secondary-500 hover:text-primary-600 dark:text-secondary-400"
          >
            … ver más
          </button>
        ) : null}
      </div>

      {imagenUrl ? (
        <div className="border-y border-secondary-200 bg-secondary-50 dark:border-secondary-800 dark:bg-secondary-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagenUrl}
            alt="Vista previa del contenido visual"
            className="w-full max-h-[480px] object-contain"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between px-4 py-2 text-[11px] text-secondary-500 dark:text-secondary-400">
        <div className="flex items-center gap-1">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-600">
            <HandThumbUpSolid className="h-2.5 w-2.5 text-white" />
          </span>
          <span>12</span>
        </div>
        <div className="flex items-center gap-3">
          <span>3 comentarios</span>
          <span>·</span>
          <span>1 republicación</span>
        </div>
      </div>

      <div className="border-t border-secondary-200 px-2 py-1 dark:border-secondary-800">
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: 'Recomendar', Icon: HandThumbUpIcon },
            { label: 'Comentar', Icon: ChatBubbleOvalLeftIcon },
            { label: 'Compartir', Icon: ArrowPathRoundedSquareIcon },
            { label: 'Enviar', Icon: PaperAirplaneIcon },
          ].map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              className="flex items-center justify-center gap-1.5 rounded px-2 py-2 text-xs font-semibold text-secondary-600 transition hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
