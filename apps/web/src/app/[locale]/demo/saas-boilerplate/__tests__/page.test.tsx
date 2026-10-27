/**
 * Demo saas-boilerplate: la página renderiza sin throw y cada pantalla usa
 * claves de traducción válidas en español y en inglés.
 */
import { act, fireEvent, screen, within } from '@testing-library/react';
import { IntlErrorCode, type IntlError } from 'next-intl';
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';
import { renderWithProviders } from '@/test-utils/render';
import type { TestLocale } from '@/test-utils/messages';

describe('Demo saas-boilerplate', () => {
  beforeEach(() => window.localStorage.clear());

  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });

  it.each<TestLocale>(['es', 'en'])('recorre las 6 pantallas sin claves inválidas (%s)', (locale) => {
    const errors: IntlError[] = [];
    renderWithProviders(<Page />, {
      locale,
      onIntlError: (e) => {
        if (e.code !== IntlErrorCode.ENVIRONMENT_FALLBACK) errors.push(e);
      },
    });
    const nav = screen.getByRole('navigation');
    const buttons = within(nav).getAllByRole('button');
    expect(buttons).toHaveLength(6);
    for (const b of buttons) {
      act(() => {
        fireEvent.click(b);
      });
      expect(b).toHaveAttribute('aria-current', 'page');
    }
    expect(errors.map((e) => `${e.code}: ${e.originalMessage ?? e.message}`)).toEqual([]);
  });
});
