import express from "express";
import cors from "cors";
import { makeSearchRouter } from "./routes/search";
import { docsRouter } from "./docs";

export function createApp(db: any) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api/search", makeSearchRouter(db));
  app.use("/api/search", docsRouter()); // => /api/search/docs, /api/search/openapi.json
  return app;
}

export default createApp;
