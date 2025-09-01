import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DetailsGrid from './DetailsGrid';
import type { FoodTruck } from './types';

function makeTruck(overrides: Partial<FoodTruck> = {}): FoodTruck {
  return {
    locationid: 1,
    applicant: 'MOMO INNOVATION LLC',
    facilityType: 'Truck',
    status: 'APPROVED',
    locationDescription: 'CALIFORNIA ST: DAVIS ST to FRONT ST (100 - 199)',
    address: '101 CALIFORNIA ST',
    foodItems: 'Noodles',
    permit: '21MFF-00089',
    latitude: 37.792949,
    longitude: -122.398099,
    approved: '2022-01-28T00:00:00.000Z',
    received: '2021-03-15T00:00:00.000Z',
    expirationDate: '2022-11-15T00:00:00.000Z',
    schedule: 'http://example.com/schedule.pdf',
    ...overrides,
  } as FoodTruck;
}

describe('DetailsGrid', () => {
  beforeEach(() => {
    // mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => null);
    // mock clipboard
    // @ts-ignore
    if (!navigator.clipboard) navigator.clipboard = {} as any;
    // @ts-ignore
    navigator.clipboard.writeText = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders KV rows with expected values and classes', () => {
    const truck = makeTruck();
    const { container } = render(<DetailsGrid foodTruck={truck} />);

    // container classes
    expect(container.querySelector('.details')).toBeTruthy();
    expect(container.querySelector('.details-actions')).toBeTruthy();
    expect(container.querySelector('.kv-grid')).toBeTruthy();

    // Check some keys exist
    const applicantRow = screen.getByText('Applicant').closest('.kv-row')!;
    expect(applicantRow).toBeTruthy();
    expect(applicantRow.querySelector('.kv-val')!).toHaveTextContent(/MOMO INNOVATION LLC/i);

    const statusRow = screen.getByText('Status').closest('.kv-row')!;
    const badge = statusRow.querySelector('.kv-val')!.firstChild;
    expect(badge).toHaveClass('badge', 'approved'); // lowercased class from status

    const coordsRow = screen.getByText('Coordinates').closest('.kv-row')!;
    expect(coordsRow).toHaveTextContent('37.792949, -122.398099'); // toFixed(6)

    const scheduleLink = screen.getByRole('link', { name: /open schedule/i });
    expect(scheduleLink).toHaveAttribute('href', truck.schedule!);
  });

  it('formats dates using toLocaleDateString()', () => {
    const truck = makeTruck();
    const approvedText = new Date(truck.approved!).toLocaleDateString();
    const receivedText = new Date(truck.received!).toLocaleDateString();
    const expiresText = new Date(truck.expirationDate!).toLocaleDateString();

    render(<DetailsGrid foodTruck={truck} />);

    expect(screen.getByText('Approved').closest('.kv-row')!).toHaveTextContent(approvedText);
    expect(screen.getByText('Received').closest('.kv-row')!).toHaveTextContent(receivedText);
    expect(screen.getByText('Expires').closest('.kv-row')!).toHaveTextContent(expiresText);
  });

  it('copies location description when clicking "Copy Address"', async () => {
    const truck = makeTruck();
    render(<DetailsGrid foodTruck={truck} />);

    const btn = screen.getByRole('button', { name: /copy address/i });
    await userEvent.click(btn);

    // @ts-ignore
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(truck.locationDescription);
  });

  it('opens maps with coordinates when available', async () => {
    const truck = makeTruck(); // has lat/lon
    render(<DetailsGrid foodTruck={truck} />);

    const btn = screen.getByRole('button', { name: /open in maps/i });
    await userEvent.click(btn);

    expect(window.open).toHaveBeenCalledTimes(1);
    const [url, target, features] = (window.open as any).mock.calls[0];
    expect(url).toContain(`https://www.google.com/maps?q=${truck.latitude},${truck.longitude}`);
    expect(target).toBe('_blank');
    expect(features).toContain('noopener');
  });

  it('opens maps search with encoded address when no coords but address exists', async () => {
    const truck = makeTruck({ latitude: undefined as any, longitude: undefined as any });
    render(<DetailsGrid foodTruck={truck} />);

    const btn = screen.getByRole('button', { name: /open in maps/i });
    await userEvent.click(btn);

    expect(window.open).toHaveBeenCalledTimes(1);
    const [url] = (window.open as any).mock.calls[0];
    expect(url).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(decodeURIComponent(url.split('query=')[1])).toBe(truck.address);
  });

  it('does nothing when neither coords nor address exist', async () => {
    const truck = makeTruck({ latitude: undefined as any, longitude: undefined as any, address: undefined as any });
    render(<DetailsGrid foodTruck={truck} />);

    const btn = screen.getByRole('button', { name: /open in maps/i });
    await userEvent.click(btn);

    expect(window.open).not.toHaveBeenCalled();
  });

  it('shows map preview iframe when coords exist', () => {
    const truck = makeTruck();
    render(<DetailsGrid foodTruck={truck} />);

    const iframe = screen.getByTitle('map') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain(`https://www.google.com/maps?q=${truck.latitude},${truck.longitude}`);
    expect(iframe.src).toContain('output=embed');
  });

  it('hides map preview when coords are missing', () => {
    const truck = makeTruck({ latitude: undefined as any, longitude: undefined as any });
    render(<DetailsGrid foodTruck={truck} />);

    expect(screen.queryByTitle('map')).toBeNull();
  });

  it('renders "—" for missing fields', () => {
    const truck = makeTruck({
      facilityType: null as any,
      foodItems: null as any,
      permit: null as any,
      schedule: null as any,
      approved: null as any,
      received: null as any,
      expirationDate: null as any,
      latitude: undefined as any,
      longitude: undefined as any,
    });

    render(<DetailsGrid foodTruck={truck} />);

    // Pick a few representative rows
    const getVal = (label: string) =>
      screen.getByText(label).closest('.kv-row')!.querySelector('.kv-val');

    expect(getVal('Facility Type')).toHaveTextContent('—');
    expect(getVal('Food Items')).toHaveTextContent('—');
    expect(getVal('Permit #')).toHaveTextContent('—');
    expect(getVal('Schedule')).toHaveTextContent('—');
    expect(getVal('Approved')).toHaveTextContent('—');
    expect(getVal('Coordinates')).toHaveTextContent('—');

  });
});
