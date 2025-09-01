import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import type { Express } from "express";
import { Router } from "express";
import path from "path";


const router = Router();

export function docsRouter() {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Food Truck Search API",
        version: "1.0.0",
        description: "Search SF mobile food facility permits by text and proximity.",
      },
      servers: [{ url: "http://localhost:3000/api/search" }],
      components: {
        schemas: {
          FoodTruckRow: {
            type: "object",
            additionalProperties: true, // CSV can add columns in the future
            required: ["locationid", "Applicant"],
            properties: {
              locationid: { type: "integer", example: 21571753, description: "Unique record id" },
              Applicant: { type: "string", example: "The Geez Freeze", description: "Vendor / applicant name" },
              FacilityType: { type: "string", nullable: true, example: "Truck" },
              cnn: { type: "integer", nullable: true, description: "SFDPW street segment id" },

              LocationDescription: { type: "string", nullable: true, example: "18TH ST: DOLORES ST to CHURCH ST (3700 - 3799)" },
              Address: { type: "string", nullable: true, example: "3750 18TH ST" },
              blocklot: { type: "string", nullable: true, description: "Block & lot identifier" },
              block: { type: "string", nullable: true },
              lot: { type: "string", nullable: true },
              permit: { type: "string", nullable: true, example: "21MFF-00015" },

              Status: {
                type: "string", nullable: true,
                description: "Permit status",
                example: "APPROVED"
                // enum: ["APPROVED","SUSPENDED","EXPIRED","REQUESTED"] // uncomment if you want to lock values
              },

              FoodItems: { type: "string", nullable: true, example: "Snow Cones; Soft Serve Ice Cream; Frozen Virgin Daiquiris" },

              X: { type: "number", format: "float", nullable: true, description: "Projected X (meters)" },
              Y: { type: "number", format: "float", nullable: true, description: "Projected Y (meters)" },

              Latitude: { type: "number", format: "float", nullable: true, example: 37.76201920035647 },
              Longitude: { type: "number", format: "float", nullable: true, example: -122.42730642251331 },

              Schedule: { type: "string", format: "uri", nullable: true, example: "http://bsm.sfdpw.org/PermitsTracker/reports/report.aspx?title=schedule&report=rptSchedule&params=permit=21MFF-00015&ExportPDF=1&Filename=21MFF-00015_schedule.pdf" },
              dayshours: { type: "string", nullable: true, description: "Human-readable hours" },

              NOISent: { type: "string", nullable: true, description: "Notice of Intent sent (source format)" },
              Approved: { type: "string", nullable: true, description: "Approval date/time (source format)" },
              Received: { type: "string", nullable: true, description: "Application received (source format)" },
              PriorPermit: { type: "integer", nullable: true },
              ExpirationDate: { type: "string", nullable: true, description: "Expiration date (source format)" },

              Location: { type: "string", nullable: true, example: "(37.76201920035647, -122.42730642251331)", description: "Original '(lat, lon)' string" },

              "Fire Prevention Districts": { type: "integer", nullable: true },
              "Police Districts": { type: "integer", nullable: true },
              "Supervisor Districts": { type: "integer", nullable: true },
              "Zip Codes": { type: "integer", nullable: true },
              "Neighborhoods (old)": { type: "integer", nullable: true }
            }
          },

          RowWithDistance: {
            allOf: [
              { $ref: "#/components/schemas/FoodTruckRow" },
              {
                type: "object",
                required: ["distance_mi"],
                properties: {
                  distance_mi: {
                    type: "number", format: "float", readOnly: true,
                    description: "Great-circle distance from query point (miles if your helper uses 3958.8; rename to distance_mi if you switch units)"
                  }
                }
              }
            ]
          },

          ErrorResponse: {
            type: "object",
            properties: {
              error: { type: "string", example: "Invalid Request" }
            }
          }
        }
      }
    },
    // Look for route files with @openapi comments (ts in dev, js in prod)
    apis: [path.join(__dirname, "./routes/*.{ts,js}")],
  } as const;

  const spec = swaggerJSDoc(options);

  router.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
  router.get("/openapi.json", (_req, res) => res.json(spec));

  return router;
}
