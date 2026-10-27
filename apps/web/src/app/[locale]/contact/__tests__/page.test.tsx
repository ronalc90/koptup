/**
 * /contact: el h1, la introducción, el horario y los enlaces de contacto no
 * dependen de la URL, así que tienen que estar en el HTML inicial. Solo el
 * encabezado del plan RAG y el formulario leen useSearchParams, y cada uno va
 * en su propio Suspense.
 */
import { renderToString } from 'react-dom/server';
import { screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import ContactPage from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';
import { TestProviders, renderWithProviders } from '@/test-utils/render';

const mockSearchParams = jest.mocked(useSearchParams);

/** La URL tal como la ve useSearchParams (ReadonlyURLSearchParams). */
const withQuery = (query: string) => new URLSearchParams(query) as unknown as ReturnType<typeof useSearchParams>;

afterEach(() => {
  mockSearchParams.mockImplementation(() => withQuery(''));
});

describe('/contact', () => {
  it.each(['es', 'en'] as const)('renderiza sin claves de traducción inválidas (%s)', (locale) => {
    smokeRenderPage(ContactPage, { locale });
  });

  it('sin plan en la URL, el h1, la introducción y el horario salen en el HTML inicial', () => {
    // Mismo caso que la compilación estática: useSearchParams suspende y el
    // Suspense de cada parte que lo usa muestra su fallback.
    mockSearchParams.mockImplementation(() => {
      throw new Promise(() => {});
    });

    const html = renderToString(
      <TestProviders>
        <ContactPage />
      </TestProviders>,
    );

    expect(html).toContain('<h1');
    expect(html).toContain('Hablemos de tu proyecto');
    expect(html).toContain('Cuéntanos tu caso');
    expect(html).toContain('Lunes a viernes, 8:00 a. m. a 6:00 p. m. (hora de Colombia)');
    expect(html).toContain('href="mailto:ronald@koptup.com"');
    expect(html).toContain('href="tel:+573024794842"');
    expect(html).not.toContain('name="email"');
  });

  it('sin plan en la URL, muestra el h1 genérico y el formulario al cargar', async () => {
    renderWithProviders(<ContactPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Hablemos de tu proyecto' })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('form')).not.toBeNull());
  });

  it('con un plan RAG en la URL, el h1 habla de ese plan', async () => {
    mockSearchParams.mockImplementation(() => withQuery('service=sistema-rag&plan=esencial'));

    renderWithProviders(<ContactPage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Cotiza el plan Esencial' })).toBeInTheDocument();
  });
});
