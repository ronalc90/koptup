import { parseDurationSeconds } from '../../utils/duration';
import { MAX_REFRESH_TTL_SECONDS, refreshTokenTtlSeconds } from '../../middleware/auth';

describe('duraciones de configuración', () => {
  it('interpreta segundos y unidades s, m, h, d y w', () => {
    expect(parseDurationSeconds('3600')).toBe(3600);
    expect(parseDurationSeconds('90s')).toBe(90);
    expect(parseDurationSeconds('15m')).toBe(900);
    expect(parseDurationSeconds('12h')).toBe(43200);
    expect(parseDurationSeconds('7d')).toBe(604800);
    expect(parseDurationSeconds('1w')).toBe(604800);
    expect(parseDurationSeconds(' 2 D ')).toBe(172800);
  });

  it('devuelve null si no se puede interpretar o no es positiva', () => {
    expect(parseDurationSeconds(undefined)).toBeNull();
    expect(parseDurationSeconds('')).toBeNull();
    expect(parseDurationSeconds('siete días')).toBeNull();
    expect(parseDurationSeconds('0')).toBeNull();
    expect(parseDurationSeconds('-5m')).toBeNull();
    expect(parseDurationSeconds('5y')).toBeNull();
  });

  it('el token de renovación usa la variable, con 7 días por defecto y como máximo', () => {
    expect(refreshTokenTtlSeconds({} as NodeJS.ProcessEnv)).toBe(MAX_REFRESH_TTL_SECONDS);
    expect(refreshTokenTtlSeconds({ JWT_REFRESH_EXPIRES_IN: '1d' } as NodeJS.ProcessEnv)).toBe(86400);
    expect(refreshTokenTtlSeconds({ JWT_REFRESH_EXPIRES_IN: '30d' } as NodeJS.ProcessEnv)).toBe(MAX_REFRESH_TTL_SECONDS);
    expect(refreshTokenTtlSeconds({ JWT_REFRESH_EXPIRES_IN: 'mal' } as NodeJS.ProcessEnv)).toBe(MAX_REFRESH_TTL_SECONDS);
  });
});
