/**
 * Smoke test módulo Voice AI: valida CRUD básico del service in-memory.
 */
import { voiceAiService } from '../voice-ai.service';

describe('Voice AI module', () => {
  it('lista calls con resultados', () => {
    const r = voiceAiService.list({});
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('obtiene una call conocida', () => {
    const first = voiceAiService.list({}).items[0];
    const found = voiceAiService.get(first.id);
    expect(found.id).toBe(first.id);
  });

  it('lista transcripts', () => {
    const transcripts = voiceAiService.listTranscripts({});
    expect(transcripts.total).toBeGreaterThanOrEqual(0);
  });
});
