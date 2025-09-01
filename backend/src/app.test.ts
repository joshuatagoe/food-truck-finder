import request from "supertest";
import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";

// --- helper: make & seed a tiny DB your routes will read ---
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
      locationdescription TEXT,
      address TEXT,
      blocklot TEXT,
      block TEXT,
      lot TEXT,
      permit TEXT,
      status TEXT,
      fooditems TEXT,
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

  ins.run(
    1, "MOMO INNOVATION LLC", "Truck", 0,
    "CALIFORNIA ST: DAVIS ST to FRONT ST (100 - 199)",
    "101 CALIFORNIA ST", null, null, null,
    "21MFF-00089", "APPROVED", "Noodles", null, null,
    37.792949, -122.398099, "http://example.com/s1"
  );

  db.close();
  return dbPath;
}

describe("app wiring (CORS, docs, routing)", () => {
  let app: import("express").Express;

  beforeAll(async () => {
    // Point your routes at the seeded DB **before** importing the app
    process.env.DB_PATH = makeTempDb();
    const { createApp } = await import("./app");
    app = createApp(new Database(process.env.DB_PATH));
  });

  test("search endpoint is reachable", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ applicant_name: "MOMO", status: "APPROVED", limit: 5 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    console.log(res.body);
    expect(res.body[0]?.applicant).toMatch(/MOMO/);
  });
});
