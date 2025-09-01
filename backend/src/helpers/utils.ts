import { FoodTruckRow } from "../types/foodTruckRow";

export function hasCoords(r: FoodTruckRow): r is FoodTruckRow & { latitude: number; longitude: number } {
  return r.latitude != null && r.longitude != null;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const rlat1 = toRadians(lat1);
  const rlat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rlat1) * Math.cos(rlat2) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function attempt<T>(fn: () => T, fallback: T): [T | null, Error | null] {
  try { return [fn(), null]; } catch (e) { return [fallback, e as Error]; }
}