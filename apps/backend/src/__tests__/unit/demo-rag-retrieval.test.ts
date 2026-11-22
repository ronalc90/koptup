/**
 * «Prueba con tu documento»: selección de extractos.
 *
 * Caso real: con un PDF de 18 páginas, "que dice el archivo o sobre que es?"
 * respondía "No encontré esa información en el documento." porque BM25
 * coincidía solo por "que" y "sobre" y mandaba 5 extractos al azar.
 */
import {
  contentQuery,
  isOverviewQuestion,
  overviewSample,
  selectChunks,
} from '../../services/demo-rag.service';
import { tokenize } from '../../services/rag-pipeline';

interface TestChunk {
  label: number;
  text: string;
  tokens: string[];
}

/** 18 páginas de una clase: todas usan "que" y "sobre"; solo la 9 habla de fotosíntesis. */
function classChunks(): TestChunk[] {
  return Array.from({ length: 18 }, (_, i) => {
    const page = i + 1;
    const text =
      page === 9
        ? 'La fotosíntesis es el proceso que usan las plantas para convertir la luz sobre las hojas en energía.'
        : `Página ${page} de la clase: ejercicios que el estudiante resuelve sobre la unidad ${page}.`;
    return { label: page, text, tokens: tokenize(text) };
  });
}

describe('demo RAG: preguntas generales', () => {
  it.each([
    'que dice el archivo o sobre que es?',
    '¿De qué trata el documento?',
    'Resume el documento',
    'resúmeme la clase',
    '¿Cuáles son los temas principales?',
    'What is this document about?',
    'Give me a summary',
  ])('"%s" es una pregunta general', (q) => {
    expect(isOverviewQuestion(q)).toBe(true);
  });

  it.each(['¿Qué es la fotosíntesis?', '¿Cuánto cuesta el plan básico?', 'What is the refund policy?'])(
    '"%s" es una pregunta concreta',
    (q) => {
      expect(isOverviewQuestion(q)).toBe(false);
    },
  );

  it('quita palabras vacías y meta-palabras de la búsqueda', () => {
    expect(contentQuery('que dice el archivo o sobre que es?')).toBe('');
    expect(contentQuery('¿Qué es la fotosíntesis?')).toBe('fotosíntesis');
  });

  it('la muestra general incluye el inicio y llega hasta el final del documento', () => {
    const labels = overviewSample(classChunks()).map((c) => c.label);
    expect(labels).toHaveLength(6);
    expect(labels.slice(0, 2)).toEqual([1, 2]);
    expect(labels[labels.length - 1]).toBe(18);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('la pregunta del caso real recibe una muestra del documento, en orden', () => {
    const labels = selectChunks('que dice el archivo o sobre que es?', classChunks()).map((r) => r.chunk.label);
    expect(labels).toEqual([...labels].sort((a, b) => a - b));
    expect(labels[0]).toBe(1);
    expect(labels[labels.length - 1]).toBe(18);
  });

  it('una pregunta concreta trae el extracto que la responde primero', () => {
    const selected = selectChunks('¿Qué es la fotosíntesis?', classChunks());
    expect(selected[0].chunk.label).toBe(9);
    expect(selected.every((r) => r.score > 0)).toBe(true);
  });

  it('un resumen de un tema une la muestra con los extractos del tema', () => {
    const labels = selectChunks('Resume lo que dice sobre la fotosíntesis', classChunks()).map((r) => r.chunk.label);
    expect(labels).toContain(9);
    expect(labels).toContain(1);
    expect(labels.length).toBeLessThanOrEqual(8);
  });

  it('documentos cortos se envían completos', () => {
    const chunks = classChunks().slice(0, 4);
    expect(selectChunks('¿de qué trata?', chunks).map((r) => r.chunk.label)).toEqual([1, 2, 3, 4]);
  });
});
