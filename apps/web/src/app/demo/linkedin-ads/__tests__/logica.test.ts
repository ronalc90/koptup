import { clasificarErrorIA, esSesionVencida } from '../components/errores';
import { aplicarUtm, consultaUtm, incluyeEnlace, normalizarEnlaceDemo } from '../components/generador';
import { adaptarRespuesta } from '../components/respuestaIA';
import { revisarTexto } from '../components/veracidad';

const URL_CHATBOT = 'https://www.koptup.com/demo/chatbot';

describe('clasificarErrorIA', () => {
  it('lee el código del formato único de errores', () => {
    expect(clasificarErrorIA(503, { code: 'budget_exhausted', message: 'x' }).motivo).toBe('budget');
    expect(clasificarErrorIA(503, { code: 'ai_not_configured' }).motivo).toBe('notConfigured');
    expect(clasificarErrorIA(503, { code: 'limits_unavailable' }).motivo).toBe('limitsUnavailable');
    expect(clasificarErrorIA(403, { code: 'demo_access_required' }).motivo).toBe('access');
    expect(clasificarErrorIA(403, { code: 'demo_disabled' }).motivo).toBe('disabled');
    expect(clasificarErrorIA(401, { code: 'login_required' }).motivo).toBe('login');
    expect(clasificarErrorIA(502, { code: 'llm_error' }).motivo).toBe('llm');
    expect(clasificarErrorIA(502, { code: 'invalid_output' }).motivo).toBe('invalid');
    expect(clasificarErrorIA(503, { code: 'service_unavailable' }).motivo).toBe('unavailable');
    expect(clasificarErrorIA(400, { code: 'invalid_request' }).motivo).toBe('badRequest');
  });

  it('calcula los minutos de espera del límite de generaciones', () => {
    expect(clasificarErrorIA(429, { code: 'rate_limited', retryAfterSec: 125 })).toEqual({ motivo: 'rateLimited', minutos: 3 });
    expect(clasificarErrorIA(429, { code: 'rate_limited' }, '30')).toEqual({ motivo: 'rateLimited', minutos: 1 });
    expect(clasificarErrorIA(429, { code: 'rate_limited' })).toEqual({ motivo: 'rateLimited', minutos: undefined });
  });

  it('sin código usa el estado y el texto anterior (compatibilidad)', () => {
    expect(clasificarErrorIA(429, null).motivo).toBe('rateLimited');
    expect(clasificarErrorIA(402, null).motivo).toBe('budget');
    expect(clasificarErrorIA(503, { error: 'OPENAI_API_KEY no configurada' }).motivo).toBe('notConfigured');
    expect(clasificarErrorIA(503, { message: 'Alcanzamos el cupo mensual de generación con IA' }).motivo).toBe('budget');
    expect(clasificarErrorIA(503, null).motivo).toBe('unavailable');
    expect(clasificarErrorIA(500, null).motivo).toBe('generic');
  });

  it('reconoce la sesión vencida que se puede renovar', () => {
    expect(esSesionVencida(401, { code: 'TOKEN_EXPIRED' })).toBe(true);
    expect(esSesionVencida(401, { code: 'login_required' })).toBe(false);
  });
});

describe('enlaces y UTM', () => {
  it('lleva a la URL canónica el enlace que escribe la IA con otro dominio o parámetros', () => {
    const texto = 'Pruébala: http://localhost:3400/demo/chatbot?utm_source=x. Y la otra: https://www.koptup.com/demo/chatbot-pro';
    expect(normalizarEnlaceDemo(texto, '/demo/chatbot', URL_CHATBOT)).toBe(
      `Pruébala: ${URL_CHATBOT}. Y la otra: https://www.koptup.com/demo/chatbot-pro`,
    );
  });

  it('distingue el enlace exacto de otra ruta que empieza igual', () => {
    expect(incluyeEnlace(`Mira ${URL_CHATBOT}`, URL_CHATBOT)).toBe(true);
    expect(incluyeEnlace(`Mira ${URL_CHATBOT}?utm_source=linkedin`, URL_CHATBOT)).toBe(true);
    expect(incluyeEnlace(`Mira ${URL_CHATBOT}-pro`, URL_CHATBOT)).toBe(false);
  });

  it('agrega y quita la UTM solo en el enlace de la demo', () => {
    const q = consultaUtm({ slug: 'chatbot' }, 'lanzamiento', 'organic');
    const con = aplicarUtm(`👉 ${URL_CHATBOT}`, URL_CHATBOT, q, true);
    expect(con).toBe(`👉 ${URL_CHATBOT}?${q}`);
    expect(aplicarUtm(con, URL_CHATBOT, q, false)).toBe(`👉 ${URL_CHATBOT}`);
    expect(revisarTexto(con, URL_CHATBOT)).toMatchObject({ enlace: true, utm: true });
  });
});

describe('adaptarRespuesta', () => {
  const base = {
    model: 'gpt-4o-mini',
    data: {
      post: { hook: 'Gancho', body: 'Cuerpo', cta: 'Mira la demo', hashtags: ['KopTup', '#IA generativa', '(x)'] },
      ad: { headline: 'Título', introText: 'Intro en http://localhost:3400/demo/chatbot', description: 'Desc', cta: 'Probar demo' },
      carrusel: [
        { numero: 3, titulo: 'Uno', bullets: ['a'], notaVisual: 'n' },
        { numero: 3, titulo: 'Dos', bullets: [], notaVisual: '' },
      ],
      estrategia: 'Porque sí',
    },
  };

  it('agrega el enlace a la demo si la IA no lo escribió y limpia las etiquetas', () => {
    const pack = adaptarRespuesta(base, 1, { path: '/demo/chatbot' }, URL_CHATBOT);
    expect(pack).not.toBeNull();
    expect(pack?.textoPost).toContain(`Mira la demo\n👉 ${URL_CHATBOT}`);
    expect(pack?.textoPost.endsWith('#KopTup #IAgenerativa #x')).toBe(true);
    expect(pack?.ad.introText).toBe(`Intro en ${URL_CHATBOT}`);
    expect(pack?.carrusel.map((s) => s.numero)).toEqual([1, 2]);
  });

  it('no duplica el enlace si ya viene en el texto', () => {
    const conEnlace = { ...base, data: { ...base.data, post: { ...base.data.post, cta: `Pruébala en http://localhost:3400/demo/chatbot` } } };
    const pack = adaptarRespuesta(conEnlace, 2, { path: '/demo/chatbot' }, URL_CHATBOT);
    expect(pack?.textoPost.split(URL_CHATBOT).length).toBe(2);
  });

  it('rechaza una respuesta incompleta', () => {
    expect(adaptarRespuesta({ data: { post: { hook: 'x' } } }, 3, { path: '/demo/chatbot' }, URL_CHATBOT)).toBeNull();
  });
});
