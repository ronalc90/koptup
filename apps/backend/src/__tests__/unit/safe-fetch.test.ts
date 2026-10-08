import { isBlockedAddress, resolvePublicTarget, SafeFetchError } from '../../services/safe-fetch.service';

describe('protección SSRF de la ingesta de URLs', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.5',
    '172.16.3.4',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fe80::1',
    'fd00:ec2::254',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    '64:ff9b::a00:1',
  ])('bloquea %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111'])('permite la dirección pública %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });

  const lookupTo = (address: string) => async () => [{ address, family: address.includes(':') ? 6 : 4 }];

  it('rechaza un nombre que resuelve a una IP interna (DNS)', async () => {
    await expect(resolvePublicTarget('https://interno.example.com/', lookupTo('10.1.2.3'))).rejects.toMatchObject({ reason: 'blocked_address' });
  });

  it('acepta un nombre que resuelve a una IP pública y conecta a esa IP', async () => {
    const target = await resolvePublicTarget('https://publico.example.com/ruta', lookupTo('93.184.216.34'));
    expect(target.address).toBe('93.184.216.34');
  });

  it('rechaza esquemas, credenciales y puertos no permitidos', async () => {
    for (const [url, reason] of [
      ['file:///etc/passwd', 'invalid_url'],
      ['ftp://example.com/', 'invalid_url'],
      ['http://usuario:clave@example.com/', 'invalid_url'],
      ['http://example.com:6379/', 'blocked_port'],
    ] as const) {
      const err = await resolvePublicTarget(url, lookupTo('93.184.216.34')).catch((e) => e);
      expect(err).toBeInstanceOf(SafeFetchError);
      expect(err.reason).toBe(reason);
    }
  });

  it('si alguna de las IPs resueltas es interna, se rechaza', async () => {
    const lookup = async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ];
    await expect(resolvePublicTarget('https://mixto.example.com/', lookup)).rejects.toMatchObject({ reason: 'blocked_address' });
  });
});
