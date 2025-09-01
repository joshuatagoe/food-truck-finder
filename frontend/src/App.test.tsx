import { render, screen } from '@testing-library/react';
import App from './App';
import { vi } from 'vitest';

// Autocomplete Component Stub
vi.mock('./AutoComplete', () => ({
  __esModule: true,
  default: () => <div data-testid="auto-complete-stub" />,
}));

test('renders the title text', () => {
  const { container } = render(<App />);

  // Top-level wrapper class
  expect(container.firstChild).toHaveClass('app');

  // Title parts
  expect(screen.getByText(/Hello\s+Rad AI\./i)).toBeInTheDocument();
  expect(screen.getByText(/Let's Analyze some Data\./i)).toBeInTheDocument();
});

test('renders the AutoComplete component (stubbed)', () => {
  render(<App />);
  expect(screen.getByTestId('auto-complete-stub')).toBeInTheDocument();
});
