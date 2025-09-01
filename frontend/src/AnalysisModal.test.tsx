import { render, screen, fireEvent } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import AnalysisModal from './AnalysisModal';
import type { FoodTruck } from './types';

// stub DetailsGrid so tests don't depend on its internals
vi.mock('./DetailsGrid', () => ({
    __esModule: true,
    default: ({ foodTruck }: { foodTruck: FoodTruck }) => (
        <div data-testid="details-grid">Details for: {foodTruck.applicant}</div>
    ),
}));

const truck = { applicant: 'Tasty Tacos' } as unknown as FoodTruck;

test('renders title and DetailsGrid', () => {
    const onClose = vi.fn();
    render(<AnalysisModal foodTruck={truck} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: /tasty tacos/i })).toBeInTheDocument();
    expect(screen.getByTestId('details-grid')).toBeInTheDocument();
});

test('clicking the close button calls onClose', () => {
    const onClose = vi.fn();
    render(<AnalysisModal foodTruck={truck} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking the backdrop calls onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<AnalysisModal foodTruck={truck} onClose={onClose} />);

    const backdrop = container.querySelector('.modal-backdrop') as HTMLDivElement;
    fireEvent.click(backdrop); // target === currentTarget
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking inside the modal does NOT call onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<AnalysisModal foodTruck={truck} onClose={onClose} />);

    const modal = container.querySelector('.modal') as HTMLDivElement;
    fireEvent.click(modal); // target !== currentTarget
    expect(onClose).not.toHaveBeenCalled();
});
