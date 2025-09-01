import { createApp } from "./app";
import { ensureSchema } from "./db/migrate";

const port = process.env.PORT || 3000;


if (process.env.NODE_ENV !== "test") {
  const db = ensureSchema() // <-- runs once at startup
  createApp(db).listen(port, () => console.log(`API on http://localhost:${port}`));
}
