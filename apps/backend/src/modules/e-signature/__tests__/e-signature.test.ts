/**
 * Smoke test módulo E-Signature (firma electrónica): valida CRUD básico.
 */
import { eSignatureService } from '../e-signature.service';

describe('E-Signature module', () => {
  it('lista envelopes con resultados', () => {
    const r = eSignatureService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene un envelope conocido', () => {
    const first = eSignatureService.list({}).items[0];
    const found = eSignatureService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista signers de un envelope', () => {
    const first = eSignatureService.list({}).items[0];
    const signers = eSignatureService.listSigners(first.id);
    expect(Array.isArray(signers)).toBe(true);
  });
});
