import { ApiError, esErrorDeAcceso, motivoDeAcceso, tipoDeError } from '../api';

describe('errores del servidor de la demo', () => {
  it('trata 401 y 403 como problema de acceso y dice el motivo', () => {
    expect(esErrorDeAcceso(new ApiError(401, 'TOKEN_EXPIRED'))).toBe(true);
    expect(esErrorDeAcceso(new ApiError(403, 'demo_access_required', 'expirado'))).toBe(true);
    expect(esErrorDeAcceso(new ApiError(429, 'rate_limited'))).toBe(false);
    expect(esErrorDeAcceso(new Error('x'))).toBe(false);

    expect(motivoDeAcceso(new ApiError(401, 'login_required', 'sin_sesion'))).toBe('sesion');
    expect(motivoDeAcceso(new ApiError(403, 'demo_access_required', 'expirado'))).toBe('expirado');
    expect(motivoDeAcceso(new ApiError(403, 'demo_access_required', 'revocado'))).toBe('revocado');
    expect(motivoDeAcceso(new ApiError(403, 'demo_access_required', 'sin_acceso'))).toBe('sinAcceso');
    expect(motivoDeAcceso(new ApiError(403, 'demo_disabled', 'desactivada'))).toBe('desactivada');
  });

  it('distingue límite de solicitudes, cupo de IA y servicio caído', () => {
    expect(tipoDeError(new ApiError(0, 'network'))).toBe('network');
    expect(tipoDeError(new ApiError(404))).toBe('notFound');
    expect(tipoDeError(new ApiError(400))).toBe('badRequest');
    expect(tipoDeError(new ApiError(429, 'rate_limited'))).toBe('rateLimited');
    expect(tipoDeError(new ApiError(429, 'ai_user_limit'))).toBe('aiLimit');
    expect(tipoDeError(new ApiError(503, 'budget_exhausted'))).toBe('aiBudget');
    expect(tipoDeError(new ApiError(503, 'ai_unavailable'))).toBe('aiUnavailable');
    expect(tipoDeError(new ApiError(503, 'service_unavailable'))).toBe('unavailable');
    expect(tipoDeError(new ApiError(500))).toBe('server');
    expect(tipoDeError('otra cosa')).toBe('server');
  });
});
