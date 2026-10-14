/**
 * Revisión adversarial final de /demo/chatbot:
 * - "Prueba con tu documento" dice la causa real cuando el documento tiene
 *   demasiado texto (`too_much_text`), en lugar de "Algo salió mal".
 * - "O agrega una página web pública" del Builder: dirección normalizada y
 *   mensaje según el motivo que devuelve el servidor.
 */
import es from '../../../../../messages/demos/chatbot.es.json';
import en from '../../../../../messages/demos/chatbot.en.json';
import { DEFAULT_DEMO_LIMITS } from '../components/upload/api';
import { demoErrorText } from '../components/upload/messages';
import { normalizeUrl, urlErrorMessage } from '../components/builder/urlIngest';

const translator = (messages: Record<string, unknown>) => (key: string) =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages) as string;

describe('errores de "Prueba con tu documento"', () => {
  it('too_much_text tiene su propio mensaje en ES y EN', () => {
    const tEs = translator(es.demoChatbot.uploadDemo);
    const tEn = translator(en.demoChatbot.uploadDemo);
    expect(demoErrorText(tEs, 'too_much_text', DEFAULT_DEMO_LIMITS)).toMatch(/demasiado texto/);
    expect(demoErrorText(tEn, 'too_much_text', DEFAULT_DEMO_LIMITS)).toMatch(/too much text/);
  });
});

describe('páginas web del Builder', () => {
  it('completa https:// y rechaza lo que no es una URL http(s)', () => {
    expect(normalizeUrl('www.ejemplo.com/faq')).toBe('https://www.ejemplo.com/faq');
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com/');
    expect(normalizeUrl('http://127.0.0.1/')).toBe('http://127.0.0.1/');
    expect(normalizeUrl('ftp://example.com')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('hola')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });

  it('usa el mensaje del motivo, el de error HTTP con su código o el genérico', () => {
    expect(urlErrorMessage('blocked_address')).toEqual({ key: 'blocked_address' });
    expect(urlErrorMessage('http_404')).toEqual({ key: 'http', status: '404' });
    expect(urlErrorMessage('algo_nuevo')).toEqual({ key: 'generic' });
  });

  it('cada motivo tiene texto en ES y EN', () => {
    const reasons = ['invalid_url', 'blocked_address', 'blocked_port', 'dns_failed', 'timeout', 'too_large', 'too_many_redirects', 'unsupported_content_type', 'empty_content', 'bot_capacity', 'fetch_failed', 'http', 'generic'];
    for (const r of reasons) {
      expect(es.demoChatbot.builder.knowledge.urlErrors[r as keyof typeof es.demoChatbot.builder.knowledge.urlErrors]).toContain('{url}');
      expect(en.demoChatbot.builder.knowledge.urlErrors[r as keyof typeof en.demoChatbot.builder.knowledge.urlErrors]).toContain('{url}');
    }
  });
});
