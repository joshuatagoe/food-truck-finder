import { Router } from "express";
import { FoodTruckRow } from "../types/foodTruckRow";
import { hasCoords, haversineDistance, attempt } from "../helpers/utils";

/* 
* API Routes needed: Search by applicant name, optional field: status
* Search by street name, includes partial word search
* Search by latitude/longitude
*/

type SearchParams = {
  applicantName: string;
  streetName: string;
  status: string;
  limit: number;
};

export function makeSearchRouter(db: any) {
  const router = Router();
  /**
   * @openapi
   * /:
   *   get:
   *     summary: Search food trucks
   *     description: >
   *       Filter by applicant/street/status. If latitude & longitude are provided,
   *       results include `distance_mi` and are sorted nearest-first.
   *     parameters:
   *       - in: query
   *         name: applicantName
   *         schema: { type: string }
   *         description: Substring match (case-insensitive). Empty string = no filter.
   *       - in: query
   *         name: streetName
   *         schema: { type: string }
   *         description: Substring match (case-insensitive). Empty string = no filter.
   *       - in: query
   *         name: status
   *         schema: { type: string, default: "" }
   *         description: Exact status (e.g., 'APPROVED' | 'SUSPEND' | 'EXPIRED' | 'REQUESTED' | 'ISSUED'). Empty string = no filter.
   *       - in: query
   *         name: limit
   *         schema: { type: integer, minimum: 1, default: 5 }
   *       - in: query
   *         name: latitude
   *         schema: { type: number }
   *       - in: query
   *         name: longitude
   *         schema: { type: number }
   *     responses:
   *       200:
   *         description: Success
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/FoodTruckRow'
   *                   - $ref: '#/components/schemas/RowWithDistance'
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get("/", async (req, res) => {
    const query = req.query;
    const search_params: SearchParams = {
      applicantName: (query.applicantName as string) ?? "",
      streetName: (query.streetName as string) ?? "",
      status: (query.status as string) ?? "APPROVED",
      limit: query.limit ? Number(query.limit) : 5,
    }

    const sql = db.prepare(`
      SELECT *
      FROM food_facilities
      WHERE applicant LIKE '%' || @applicantName || '%' COLLATE NOCASE
          AND address   LIKE '%' || @streetName   || '%' COLLATE NOCASE
          AND (@status = '' OR status = @status)
    `);


    const [rows, err] = attempt<FoodTruckRow[]>(
      () => sql.all(search_params), []);

    if (rows == null || err != null) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }


    if (query.latitude && query.longitude) {
      const lat0 = parseFloat(query.latitude as string);
      const lon0 = parseFloat(query.longitude as string);

      const withDistance = rows.filter(hasCoords)
        .map(r => ({
          ...r,
          distance_mi: haversineDistance(lat0, lon0, r.latitude, r.longitude),
        }))
        .sort((a, b) => a.distance_mi - b.distance_mi)
        .slice(0, search_params.limit);
      return res.json(withDistance);
    }

    return res.json(rows.slice(0, search_params.limit));
  })

  return router;
}