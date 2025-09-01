import express from "express";
import request from "supertest";
import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";

/** Create a temp SQLite db and seed the table your route queries. */
function makeTempDb(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ftest-"));
  const dbPath = path.join(dir, "data.db");
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE food_facilities (
      locationid INTEGER PRIMARY KEY,
      applicant TEXT,
      facilitytype TEXT,
      cnn INTEGER,
      locationDescription TEXT,
      address TEXT,
      blocklot TEXT,
      block TEXT,
      lot TEXT,
      permit TEXT,
      status TEXT,
      foodItems TEXT,
      x REAL, y REAL,
      latitude REAL, longitude REAL,
      schedule TEXT
    );
  `);

  const ins = db.prepare(`
    INSERT INTO food_facilities
      (locationid, applicant, facilitytype, cnn, locationdescription, address,
       blocklot, block, lot, permit, status, fooditems, x, y, latitude, longitude, schedule)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  // Approved with coords — Financial District (close to Ferry Building)
  ins.run(
    1, "MOMO INNOVATION LLC", "Truck", 0,
    "CALIFORNIA ST: DAVIS ST to FRONT ST (100 - 199)",
    "101 CALIFORNIA ST", null, null, null,
    "21MFF-00089", "APPROVED", "Noodles", null, null,
    37.792949, -122.398099, "http://example.com/s1"
  );

  // Approved with coords — Mission
  ins.run(
    2, "The Geez Freeze", "Truck", 0,
    "18TH ST: DOLORES ST to CHURCH ST (3700 - 3799)",
    "3750 18TH ST", null, null, null,
    "21MFF-00015", "APPROVED", "Ice Cream", null, null,
    37.762019, -122.427306, "http://example.com/s2"
  );

  // Different status with coords
  ins.run(
    3, "Other Vendor", "Truck", 0,
    "MARKET ST: SPEAR ST to MAIN ST",
    "1 MARKET ST", null, null, null,
    "21MFF-00016", "REQUESTED", "Sandwiches", null, null,
    37.7946, -122.3940, "http://example.com/s3"
  );

  // Row without coords (should be ignored in near-me branch)
  ins.run(
    4, "NoCoords Vendor", "Truck", 0,
    "SOMEWHERE", "123 NOWHERE", null, null, null,
    "21MFF-00017", "APPROVED", "Tacos", null, null,
    null, null, "http://example.com/s4"
  );

  db.close();
  return dbPath;
}

/** Build an express app that mounts your router. */
async function buildApp(dbPath: string) {
  // IMPORTANT: your router opens DB at module load time, so set env first:
  process.env.DB_PATH = dbPath;
  const { makeSearchRouter } = await import("./search"); // colocated import
  const app = express();
  app.use("/api/search", makeSearchRouter(new Database(dbPath)));
  return app;
}

describe("routes/search", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await buildApp(makeTempDb());
  });

  test("filters by applicant substring (defaults status=APPROVED)", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ applicantName: "MOMO", limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].applicant).toMatch(/MOMO/);
    expect(res.body[0].status).toBe("APPROVED");
  });

  test("filters by street substring", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ streetName: "CALIFORNIA", limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.map((r: any) => r.address)).toContain("101 CALIFORNIA ST");
  });

  test("status='' disables status filter (returns mixed statuses)", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ status: "", limit: 50 });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    expect(res.body.some((r: any) => r.status === "REQUESTED")).toBe(true);
  });

  test("applies limit via slice()", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ status: "", limit: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test("near-me: sorts by distance asc, adds distance_mi, ignores rows without coords", async () => {
    // Near Ferry Building (closer to 101 California than to 18th St)
    const res = await request(app)
      .get("/api/search")
      .query({
        status: "APPROVED",
        limit: 5,
        latitude: 37.7955,
        longitude: -122.3937,
      });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    // should not include the row missing coords
    expect(res.body.some((r: any) => r.latitude == null || r.longitude == null)).toBe(false);

    // distance_mi present and sorted
    expect(res.body[0]).toHaveProperty("distance_mi");
    expect(res.body[1]).toHaveProperty("distance_mi");
    expect(res.body[0].distance_mi).toBeLessThan(res.body[1].distance_mi);

    // closest should be 101 CALIFORNIA ST
    expect(res.body[0].address).toBe("101 CALIFORNIA ST");
  });

  test("only one of latitude/longitude present → no near-me branch", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ status: "APPROVED", latitude: 37.79, limit: 5 }); // longitude missing

    expect(res.status).toBe(200);
    // Should be plain rows (no distance_mi field added)
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty("distance_mi");
  });
});
