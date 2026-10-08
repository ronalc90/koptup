'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiMotor,
  ErrorApi,
  type ConfigServidor,
  type EstadisticasCups,
  type EstadisticasExperto,
  type EstadisticasVectorizacion,
  type TipoErrorApi,
} from './api';
import { horaActual } from './formato';

export type EstadoServidor = 'cargando' | 'ok' | TipoErrorApi;

export interface DatosServidor {
  experto?: EstadisticasExperto;
  cups?: EstadisticasCups;
  vector?: EstadisticasVectorizacion;
  config?: ConfigServidor;
}

const PRIORIDAD: TipoErrorApi[] = ['sin-sesion', 'sin-acceso', 'limite', 'servidor', 'sin-conexion'];

function tipoDe(error: unknown): TipoErrorApi {
  return error instanceof ErrorApi ? error.tipo : 'servidor';
}

/** Estado del servidor del motor: estadísticas, catálogo, vectorización y configuración. */
export function useServidor() {
  const [estado, setEstado] = useState<EstadoServidor>('cargando');
  const [datos, setDatos] = useState<DatosServidor>({});
  const [actualizado, setActualizado] = useState<string | null>(null);
  const montado = useRef(true);
  const iniciado = useRef(false);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    // /api/expert/estadisticas ya incluye la configuración actual del motor
    // (la misma de GET /api/expert/configuracion): 3 llamadas en lugar de 4.
    const [experto, cups, vector] = await Promise.allSettled([
      apiMotor.estadisticas(),
      apiMotor.estadisticasCups(),
      apiMotor.estadisticasVectorizacion(),
    ]);
    if (!montado.current) return;

    const resultados = [experto, cups, vector];
    const errores = resultados
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => tipoDe(r.reason));

    setDatos({
      experto: experto.status === 'fulfilled' ? experto.value : undefined,
      cups: cups.status === 'fulfilled' ? cups.value : undefined,
      vector: vector.status === 'fulfilled' ? vector.value : undefined,
      config: experto.status === 'fulfilled' ? experto.value.configuracionActual : undefined,
    });
    setActualizado(horaActual());

    const deAcceso = PRIORIDAD.slice(0, 3).find((t) => errores.includes(t));
    if (deAcceso) {
      setEstado(deAcceso);
    } else if (errores.length === resultados.length) {
      setEstado(PRIORIDAD.find((t) => errores.includes(t)) || 'servidor');
    } else {
      setEstado('ok');
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    // Una sola carga inicial (el modo estricto de React monta dos veces en desarrollo).
    if (!iniciado.current) {
      iniciado.current = true;
      cargar();
    }
    return () => {
      montado.current = false;
    };
  }, [cargar]);

  const guardarConfig = useCallback(async (config: ConfigServidor) => {
    const guardada = await apiMotor.guardarConfiguracion(config);
    if (montado.current) setDatos((d) => ({ ...d, config: guardada }));
    return guardada;
  }, []);

  return { estado, datos, actualizado, recargar: cargar, guardarConfig };
}
