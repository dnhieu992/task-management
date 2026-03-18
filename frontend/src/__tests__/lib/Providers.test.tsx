// frontend/src/__tests__/lib/Providers.test.tsx
import { render, screen } from '@testing-library/react';
import { Providers } from '@/shared/lib/Providers';

describe('Providers', () => {
  it('renders children', () => {
    render(
      <Providers>
        <span>hello</span>
      </Providers>
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
