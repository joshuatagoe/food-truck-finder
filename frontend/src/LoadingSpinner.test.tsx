import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with role=status and accessible name', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toBeInTheDocument();
  });

  it('uses the expected CSS class and has no children', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toHaveClass('loading-spinner');
    expect(spinner).toBeEmptyDOMElement();
  });
});
