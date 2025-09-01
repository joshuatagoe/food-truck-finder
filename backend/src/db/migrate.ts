import fs from "fs";
import path from "path";
import { DB_FILE, SCHEMA_PATH } from "./paths";
import { loadCSV } from "./loadCsv";
import Database from "better-sqlite3";


const DB_DIR = path.dirname(DB_FILE);
const TARGET_VERSION = 1;

export function ensureSchema() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_FILE);
  try {
    
    const current = db.pragma("user_version", { simple: true }) as number;
    if (current < TARGET_VERSION) {
      const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
      db.transaction(() => db.exec(sql))();
      db.pragma(`user_version = ${TARGET_VERSION}`);
    }

    const { c } = db.prepare(`SELECT COUNT(*) AS c FROM food_facilities`).get() as { c: number };
    if (c === 0) {
      console.log("[seed] empty → loading CSV…");
      loadCSV(db);
      console.log("[seed] done");
    } else {
      console.log(`[seed] skip (rows=${c})`);
    }
  } finally {
    return db;
  }
}