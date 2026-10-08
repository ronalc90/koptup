/**
 * Pruebas del arnés de pruebas: confirman que smokeRenderPage usa los mensajes
 * reales y que detecta los fallos que promete detectar.
 */
import { screen } from '@testing-library/react';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { smokeRenderPage, smokeRenderPageAsync } from '../smoke';

function NavLabel() {
  const t = useTranslations('nav');
  return <p>{t('contact')}</p>;
}

function MissingKey() {
  const t = useTranslations('nav');
  return <p>{t('estaClaveNoExiste')}</p>;
}

function Broken(): JSX.Element {
  throw new Error('fallo al renderizar');
}

function Empty() {
  return null;
}

function UsesRouter() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button type="button" onClick={() => router.push('/demo')}>
      {pathname}
    </button>
  );
}

function LoadsAfterMount() {
  const [label, setLabel] = useState('cargando');
  useEffect(() => {
    Promise.resolve().then(() => setLabel('listo'));
  }, []);
  return <p>{label}</p>;
}

describe('smokeRenderPage', () => {
  it('renderiza con los mensajes reales en español', () => {
    smokeRenderPage(NavLabel);
    expect(screen.getByText('Contacto')).toBeInTheDocument();
  });

  it('renderiza con los mensajes reales en inglés', () => {
    smokeRenderPage(NavLabel, { locale: 'en' });
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('falla si la página usa una clave de traducción inexistente', () => {
    expect(() => smokeRenderPage(MissingKey)).toThrow(/traducciones inválidas[\s\S]*MISSING_MESSAGE/);
  });

  it('falla si la página lanza un error al renderizar', () => {
    // React registra el error en consola antes de relanzarlo: se silencia
    // solo durante esta prueba.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => smokeRenderPage(Broken)).toThrow('fallo al renderizar');
    } finally {
      consoleError.mockRestore();
    }
  });

  it('falla si la página no pinta nada', () => {
    expect(() => smokeRenderPage(Empty)).toThrow('no renderizó contenido');
  });

  it('simula next/navigation', () => {
    smokeRenderPage(UsesRouter);
    screen.getByRole('button').click();
    expect(useRouter().push).toHaveBeenCalledWith('/demo');
  });
});

describe('smokeRenderPageAsync', () => {
  it('aplica los efectos que terminan justo después del montaje', async () => {
    await smokeRenderPageAsync(LoadsAfterMount);
    expect(screen.getByText('listo')).toBeInTheDocument();
  });

  it('también falla con claves de traducción inexistentes', async () => {
    await expect(smokeRenderPageAsync(MissingKey, { locale: 'en' })).rejects.toThrow(/traducciones inválidas \(en\)/);
  });
});

describe('red en pruebas unitarias', () => {
  it('fetch está bloqueado y responde con error', async () => {
    await expect(fetch('https://example.com/api')).rejects.toThrow('Red deshabilitada en pruebas unitarias');
  });

  it('axios (XMLHttpRequest) está bloqueado y responde con error de red', async () => {
    await expect(axios.get('https://example.com/api')).rejects.toMatchObject({ code: 'ERR_NETWORK' });
  });

  it('WebSocket no conecta y emite error y cierre', async () => {
    const events: string[] = [];
    const ws = new WebSocket('wss://example.com/socket');
    ws.onerror = () => events.push('error');
    ws.addEventListener('close', () => events.push('close'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(events).toEqual(['error', 'close']);
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });
});
