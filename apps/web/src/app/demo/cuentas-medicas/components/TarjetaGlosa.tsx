'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUturnLeftIcon, CheckIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import type { Glosa, Procedimiento } from '../tipos-auditoria';
import {
  CLAVE_TIPO_GLOSA,
  anonimizarTexto,
  decisionDeGlosa,
  formatearCOP,
  type DecisionGlosa,
} from '../lib/formato';
import { PORCENTAJE_GLOSA_SIN_TARIFA, tarifaDe } from '../lib/tarifarioDemo';

export interface CambiosGlosa {
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  valorGlosado: number;
  observaciones: string;
}

interface Props {
  glosa: Glosa;
  procedimiento?: Procedimiento;
  propuesto: number;
  maximo: number;
  ocupado: boolean;
  onGuardar: (cambios: CambiosGlosa) => Promise<boolean>;
}

const ESTILO_DECISION: Record<DecisionGlosa, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  confirmada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  ajustada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  descartada: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
};

export default function TarjetaGlosa({ glosa, procedimiento, propuesto, maximo, ocupado, onGuardar }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const idValor = useId();
  const idNota = useId();
  const [modo, setModo] = useState<'ajustar' | 'descartar' | null>(null);
  const [valor, setValor] = useState(String(glosa.valorGlosado));
  const [nota, setNota] = useState('');
  const [aviso, setAviso] = useState('');

  const etiquetas = { prestador: t('entities.provider'), pagador: t('entities.payer') };
  const decision = decisionDeGlosa(glosa, propuesto);
  const claveTipo = CLAVE_TIPO_GLOSA[glosa.tipo];

  let descripcion = anonimizarTexto(glosa.descripcion, etiquetas);
  if (glosa.tipo === 'Tarifa' && procedimiento) {
    const nombre = `${procedimiento.codigoCUPS} ${procedimiento.descripcion}`;
    descripcion = tarifaDe(procedimiento.codigoCUPS)
      ? t('denials.tariffText', {
          procedure: nombre,
          billed: formatearCOP(procedimiento.valorUnitarioIPS, locale),
          tariff: formatearCOP(procedimiento.valorUnitarioContrato, locale),
        })
      : t('denials.noTariffText', { procedure: nombre, percent: PORCENTAJE_GLOSA_SIN_TARIFA });
  }

  const abrir = (m: 'ajustar' | 'descartar') => {
    setModo(m);
    setValor(String(glosa.valorGlosado));
    setNota(glosa.observaciones ?? '');
    setAviso('');
  };

  const guardarFormulario = async () => {
    if (modo === 'descartar') {
      if (!nota.trim()) {
        setAviso(t('denials.noteRequired'));
        return;
      }
      if (await onGuardar({ estado: 'Rechazada', valorGlosado: 0, observaciones: nota.trim() })) setModo(null);
      return;
    }
    const numero = Math.round(Number(valor));
    if (!valor.trim() || !Number.isFinite(numero) || numero < 0 || numero > maximo) {
      setAviso(t('denials.invalidValue', { max: formatearCOP(maximo, locale) }));
      return;
    }
    if (await onGuardar({ estado: 'Aceptada', valorGlosado: numero, observaciones: nota.trim() })) setModo(null);
  };

  return (
    <li className="rounded-lg border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900 dark:bg-orange-950/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100">
              {t('denials.rule', { code: glosa.codigo })}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-100">
              {claveTipo ? t(`denialTypes.${claveTipo}`) : glosa.tipo}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTILO_DECISION[decision]}`}>
              {t(`denials.decision.${decision}`)}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100">{descripcion}</p>
          {glosa.observaciones && decision !== 'pendiente' && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{t('denials.note')}:</span> {anonimizarTexto(glosa.observaciones, etiquetas)}
            </p>
          )}
          {glosa.descripcion && (
            <details className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <summary className="cursor-pointer select-none">{t('denials.engineText')}</summary>
              <p className="mt-1 font-mono">{anonimizarTexto(glosa.descripcion, etiquetas)}</p>
            </details>
          )}
        </div>
        <dl className="flex flex-shrink-0 gap-4 sm:flex-col sm:gap-1 sm:text-right">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">{t('denials.proposedValue')}</dt>
            <dd className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatearCOP(propuesto, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">{t('denials.currentValue')}</dt>
            <dd className="text-xl font-bold text-orange-600 dark:text-orange-300">{formatearCOP(glosa.valorGlosado, locale)}</dd>
          </div>
        </dl>
      </div>

      {modo && (
        <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          {modo === 'ajustar' && (
            <label htmlFor={idValor} className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              {t('denials.newValue')}
              <input
                id={idValor}
                type="number"
                inputMode="numeric"
                min={0}
                max={maximo}
                step={100}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-56"
              />
            </label>
          )}
          <label htmlFor={idNota} className="block text-sm font-medium text-gray-800 dark:text-gray-200">
            {t('denials.note')}
            <textarea
              id={idNota}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t('denials.notePlaceholder')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </label>
          {aviso && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {aviso}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={guardarFormulario} isLoading={ocupado} disabled={ocupado}>
              {t('denials.save')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setModo(null)} disabled={ocupado}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {!modo && (
        <div className="mt-4 flex flex-wrap gap-2">
          {decision === 'pendiente' ? (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                disabled={ocupado}
                onClick={() => onGuardar({ estado: 'Aceptada', valorGlosado: propuesto, observaciones: '' })}
              >
                <CheckIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                {t('denials.confirm')}
              </Button>
              <Button size="sm" variant="outline" disabled={ocupado} onClick={() => abrir('ajustar')}>
                <PencilSquareIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                {t('denials.adjust')}
              </Button>
              <Button size="sm" variant="outline" className="border-gray-500 text-gray-700 hover:bg-gray-100 dark:text-gray-200" disabled={ocupado} onClick={() => abrir('descartar')}>
                <XMarkIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                {t('denials.discard')}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={ocupado}
              onClick={() => onGuardar({ estado: 'Pendiente', valorGlosado: propuesto, observaciones: '' })}
            >
              <ArrowUturnLeftIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              {t('denials.reopen')}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
