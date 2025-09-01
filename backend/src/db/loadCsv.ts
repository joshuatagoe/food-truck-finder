import fs from "fs";
import csv from "csv-parser";
import { type FoodTruckRow } from "../types/foodTruckRow";
import { CSV_PATH } from "./paths";

// Helpers
const toInt = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const toFloat = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toText = (v: any) => (v === undefined ? null : String(v));


export function loadCSV(db: any) {

  // Prepare UPSERT (uses locationid as PK)
  const insert = db.prepare(`
    INSERT INTO food_facilities (
      locationId, applicant, facilityType, cnn, locationDescription, address,
      block, lot, blocklot, permit, status, foodItems, x, y, latitude, longitude,
      schedule, dayshours, noiSent, approved, received, priorPermit, expirationDate,
      location, firePreventionDistricts, policeDistricts, supervisorDistricts,
      zipCodes, neighborhoodsOld
    ) VALUES (
      @locationId, @applicant, @facilityType, @cnn, @locationDescription, @address,
      @block, @lot, @blocklot, @permit, @status, @foodItems, @x, @y, @latitude, @longitude,
      @schedule, @dayshours, @noiSent, @approved, @received, @priorPermit, @expirationDate,
      @location, @firePreventionDistricts, @policeDistricts, @supervisorDistricts,
      @zipCodes, @neighborhoodsOld
    )
    ON CONFLICT(locationId) DO UPDATE SET
      applicant               = excluded.applicant,
      facilityType            = excluded.facilityType,
      cnn                     = excluded.cnn,
      locationDescription     = excluded.locationDescription,
      address                 = excluded.address,
      block                   = excluded.block,
      lot                     = excluded.lot,
      blocklot                = excluded.blocklot,
      permit                  = excluded.permit,
      status                  = excluded.status,
      foodItems               = excluded.foodItems,
      x                       = excluded.x,
      y                       = excluded.y,
      latitude                = excluded.latitude,
      longitude               = excluded.longitude,
      schedule                = excluded.schedule,
      dayshours               = excluded.dayshours,
      noiSent                 = excluded.noiSent,
      approved                = excluded.approved,
      received                = excluded.received,
      priorPermit             = excluded.priorPermit,
      expirationDate          = excluded.expirationDate,
      location                = excluded.location,
      firePreventionDistricts = excluded.firePreventionDistricts,
      policeDistricts         = excluded.policeDistricts,
      supervisorDistricts     = excluded.supervisorDistricts,
      zipCodes                = excluded.zipCodes,
      neighborhoodsOld        = excluded.neighborhoodsOld;
  `);

  // Wrap inserts in a single transaction for speed
  const insertMany = db.transaction((rows: any[]) => {
    for (const r of rows) insert.run(r);
  });

  (async function run() {
    const batch: any[] = [];
    const BATCH_SIZE = 1000;

    // Start a big transaction
    db.exec("BEGIN");

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on("data", (row) => {
          // Map CSV headers → DB columns (normalize types)
          const rec = {
            locationId: toInt(row["locationid"] || row["LocationID"] || row["LOCATIONID"])!, // assert not null
            applicant: toText(row["Applicant"])!,
            facilityType: toText(row["FacilityType"] || row["Facility Type"]),
            cnn: toInt(row["cnn"] || row["CNN"]),
            locationDescription: toText(row["LocationDescription"] || row["Location Description"]),
            address: toText(row["Address"]),
            block: toText(row["block"] || row["Block"]),
            lot: toText(row["lot"] || row["Lot"]),
            blocklot: toText(row["blocklot"] || row["BlockLot"] || row["Block Lot"]),
            permit: toText(row["permit"] || row["Permit"]),
            status: toText(row["Status"]),
            foodItems: toText(row["FoodItems"] || row["Food Items"]),
            x: toFloat(row["X"]),
            y: toFloat(row["Y"]),
            latitude: toFloat(row["Latitude"]),
            longitude: toFloat(row["Longitude"]),
            schedule: toText(row["Schedule"]),
            dayshours: toText(row["dayshours"] || row["DaysHours"] || row["Days/Hours"]),
            noiSent: toText(row["NOISent"] || row["NOI Sent"] || row["NOI"]),
            approved: toText(row["Approved"]),
            received: toText(row["Received"]),
            priorPermit: toInt(row["PriorPermit"] || row["Prior Permit"]),
            expirationDate: toText(row["ExpirationDate"] || row["Expiration Date"]), // <-- fixed
            location: toText(row["Location"]),
            firePreventionDistricts: toInt(row["Fire Prevention Districts"]),
            policeDistricts: toInt(row["Police Districts"]),
            supervisorDistricts: toInt(row["Supervisor Districts"]), // <-- fixed
            zipCodes: toInt(row["Zip Codes"] || row["ZipCodes"] || row["ZIP Codes"]),
            neighborhoodsOld: toText(row["Neighborhoods (old)"] || row["Neighborhoods_old"]), // <-- type align
          } satisfies FoodTruckRow;

          batch.push(rec);
          if (batch.length >= BATCH_SIZE) {
            insertMany(batch.splice(0, batch.length));
          }
        })
        .on("end", () => {
          // flush remaining
          if (batch.length) insertMany(batch);
          db.exec("COMMIT");
          // Rebuild FTS index to reflect all rows
          try {
            db.exec(`INSERT INTO food_facilities_fts(food_facilities_fts) VALUES('rebuild')`);
          } catch (e) {
          }
          console.log("CSV import complete.");
          resolve();
        })
        .on("error", (err) => {
          try { db.exec("ROLLBACK"); } catch { }
          reject(err);
        });
    }).catch((e) => {
      console.error(e);
      process.exit(1);
    });

    // Quick sanity check
    const { count } = db.prepare("SELECT COUNT(*) as count FROM food_facilities").get() as any;
    console.log(`Rows in food_facilities: ${count}`);
  })()
}
