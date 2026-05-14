import { render } from '@testing-library/react';
import type { ComponentType } from 'react';

export function smokeRenderPage(Page: ComponentType<any>) {
  const { container } = render(<Page />);
  if (!container) throw new Error('Page rendered nothing');
  return container;
}
