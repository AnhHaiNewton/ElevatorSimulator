import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App placeholder', () => {
  it('renders the title', () => {
    render(<App />);
    expect(screen.getByText('Elevator Simulator')).toBeInTheDocument();
  });
});
