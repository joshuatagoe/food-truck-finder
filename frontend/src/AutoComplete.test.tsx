import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import AutoComplete from './AutoComplete';

const defaultProps = {
  useCache: false,
  useDebounce: false,
  debounceDuration: 0,
  minSearchLength: 3,
  cacheInvalidationTimer: 60000,
};

beforeEach(() => {
  // Mock fetch to return a single food truck result
  vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
    ok: true,
    json: async () => ([
      {
        locationid: 1,
        applicant: 'MOMO INNOVATION LLC',
        locationDescription: 'CALIFORNIA ST: DAVIS ST to FRONT ST (100 - 199)',
        foodItems: 'Noodles',
        address: '101 CALIFORNIA ST',
        status: 'APPROVED',
        latitude: 37.792949,
        longitude: -122.398099,
      },
    ]),
  } as unknown as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('form renders with expected classes and labels', async () => {
  const { container } = render(<AutoComplete {...defaultProps} />);

  const form = screen.getByRole('search');
  expect(form).toBeInTheDocument();

  const statusSelect = screen.getByLabelText(/search status/i) as HTMLSelectElement;
  expect(statusSelect).toBeInTheDocument();
  expect(statusSelect).toHaveClass('status');

  const streetInput = screen.getByLabelText(/search street/i);
  const truckInput = screen.getByPlaceholderText(/find your favourite food truck/i);

  expect(streetInput).toHaveClass('searchBar');
  expect(truckInput).toHaveClass('searchBar');

  const limitInput = screen.getByLabelText(/choose a number/i) as HTMLInputElement;
  expect(limitInput).toBeInTheDocument();
  expect(limitInput.type).toBe('number');

  const nearMeCheckbox = screen.getByLabelText(/sort by closest to you|near me/i);
  expect(nearMeCheckbox).toHaveClass('check');

  expect(container).toBeTruthy();
});

test('renders results list and cards with expected classes', async () => {
  render(<AutoComplete {...defaultProps} />);

  const truckInput = screen.getByPlaceholderText(/find your favourite food truck/i);
  await userEvent.type(truckInput, 'MOMO');

  // Wait for the results to appear
  await waitFor(() => {
    const list = document.querySelector('.options-list');
    expect(list).toBeTruthy();
  });

  // Card with expected structure/class names
  const card = document.querySelector('.option-card') as HTMLElement;
  expect(card).toBeTruthy();

  const title = card.querySelector('.option-title') as HTMLElement;
  const location = card.querySelector('.option-location') as HTMLElement;
  const description = card.querySelector('.option-description') as HTMLElement;

  expect(title).toBeTruthy();
  expect(location).toBeTruthy();
  expect(description).toBeTruthy();

  // Content checks (text from mocked fetch)
  expect(title).toHaveTextContent(/MOMO INNOVATION LLC/i);
  expect(location).toHaveTextContent(/CALIFORNIA ST/i);
  expect(description).toHaveTextContent(/Noodles/i);
});
