import path from "path";

// Base paths relative to the runtime root (/app in Docker)
const APP_ROOT = process.cwd();

export const DB_FILE = process.env.DB_FILE ?? path.join(APP_ROOT, "data", "data.db");
export const CSV_PATH = process.env.CSV_PATH ?? path.join(APP_ROOT, "data", "Mobile_Food_Facility_Permit.csv");
export const SCHEMA_PATH = process.env.CSV_PATH ?? path.join(APP_ROOT, "data", "schema.sql");
export const FIND_DISTINCT_PATH = process.env.CSV_PATH ?? path.join(APP_ROOT, "data", "find_distinct.sql");