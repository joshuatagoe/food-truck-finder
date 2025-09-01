import express from "express";
import request from "supertest";
import { docsRouter } from "./docs";

// Build a tiny app that serves only the docs.
function buildApp() {
  const app = express();
  app.use("/api", docsRouter());
  return app;
}

describe("docsRouter", () => {
  let app: express.Express;

  beforeAll(() => {
    app = buildApp();
  });

  test("serves OpenAPI JSON at /api/openapi.json", async () => {
    const res = await request(app).get("/api/openapi.json");
    expect(res.status).toBe(200);
    expect(res.type).toMatch(/json/);

    // basic shape
    expect(res.body.openapi).toBe("3.0.0");
    expect(res.body.info?.title).toBe("Food Truck Search API");

    // your route doc uses path "/"
    expect(res.body.paths).toBeDefined();
    expect(res.body.paths["/"]).toBeDefined();

    // schemas present
    expect(res.body.components?.schemas?.FoodTruckRow).toBeDefined();
    expect(res.body.components?.schemas?.RowWithDistance).toBeDefined();
  });

  test("serves Swagger UI at /api/docs", async () => {
    const res = await request(app).get("/api/docs/");
    expect(res.status).toBe(200);
    // swagger-ui-express returns HTML
    expect(res.type).toMatch(/html/);
    expect(res.text).toContain('id="swagger-ui"');
  });
});
