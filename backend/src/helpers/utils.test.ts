import { toRadians, haversineDistance, hasCoords, attempt } from "./utils";

describe("toRadians", () => {
  test("0 → 0", () => {
    expect(toRadians(0)).toBeCloseTo(0, 12);
  });
  test("180 → π", () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 12);
  });
  test("90 → π/2", () => {
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 12);
  });
});

describe("haversineDistance (miles)", () => {
  test("same point ≈ 0", () => {
    expect(haversineDistance(0, 0, 0, 0)).toBeCloseTo(0, 6);
  });

  test("SF Ferry Building → Union Square ~0.9mi (ballpark)", () => {
    const mi = haversineDistance(37.7955, -122.3937, 37.7880, -122.4075);
    expect(mi).toBeGreaterThan(0.5);
    expect(mi).toBeLessThan(1.5);
    expect(mi).toBeCloseTo(0.91, 2);
  });

  test("101 California St → 18th & Dolores ~2.67mi (ballpark)", () => {
    const mi = haversineDistance(37.792949, -122.398099, 37.762019, -122.427306);
    expect(mi).toBeCloseTo(2.67, 2);
  });

  test("symmetry: A→B equals B→A", () => {
    const a = haversineDistance(37, -122, 38, -121);
    const b = haversineDistance(38, -121, 37, -122);
    expect(a).toBeCloseTo(b, 12);
  });
});

describe("hasCoords", () => {
  test("returns true when both latitude & longitude are non-null", () => {
    const row = { latitude: 37.77, longitude: -122.42 } as any;
    expect(hasCoords(row)).toBe(true);
  });

  test("returns false when latitude is null/undefined", () => {
    expect(hasCoords({ latitude: null, longitude: -122.42 } as any)).toBe(false);
    expect(hasCoords({ longitude: -122.42 } as any)).toBe(false);
  });

  test("returns false when longitude is null/undefined", () => {
    expect(hasCoords({ latitude: 37.77, longitude: null } as any)).toBe(false);
    expect(hasCoords({ latitude: 37.77 } as any)).toBe(false);
  });

  test("usable as a filter predicate", () => {
    const rows = [
      { id: 1, latitude: 37.77, longitude: -122.42 },
      { id: 2, latitude: null, longitude: -122.42 },
      { id: 3, latitude: 37.78, longitude: undefined },
      { id: 4, latitude: 37.79, longitude: -122.41 },
    ] as any[];

    const filtered = rows.filter(hasCoords);
    expect(filtered.map(r => r.id)).toEqual([1, 4]);
    // and confirm numeric values
    filtered.forEach(r => {
      expect(typeof r.latitude).toBe("number");
      expect(typeof r.longitude).toBe("number");
    });
  });
});

describe("attempt", () => {
  test("success path returns [value, null]", () => {
    const [val, err] = attempt(() => 42, -1);
    expect(val).toBe(42);
    expect(err).toBeNull();
  });

  test("error path returns [fallback, Error]", () => {
    const [val, err] = attempt(() => { throw new Error("boom"); }, "fallback");
    expect(val).toBe("fallback");
    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toMatch(/boom/);
  });
});
