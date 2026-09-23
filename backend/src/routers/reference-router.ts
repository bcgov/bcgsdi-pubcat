import express, { Request, Response } from "express";
import { sendErrorResponse } from "../core/error-handling.js";
import { handleAsync } from "../core/express-middleware.js";
import { ReferenceService } from "../services/reference-service.js";
import { CodeTableEntry } from "../types/reference.js";

/**
 * Reference router ("references" == "data from code tables in the DB")
 *
 * Mounted at `/reference` in the API router.  Each route returns the full
 * list of entries from the corresponding `*_cd` code table, projected to
 * `{ code, title, description }`.
 *
 * Routes:
 *   GET /attachment-types
 *   GET /geometry-descriptors
 *   GET /keyword-types
 *   GET /peer-review-states
 *   GET /publication-types
 *   GET /submission-relationship-types
 *   GET /submission-states
 *   GET /submission-types
 */
const referenceRouter = express.Router({ mergeParams: true });

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Returns a route handler that calls `serviceFn`, responds with the result,
 * and returns HTTP 500 on any error.
 */
function referenceHandler(serviceFn: () => Promise<CodeTableEntry[]>) {
  return handleAsync(async (_req: Request, res: Response) => {
    try {
      const results = await serviceFn();
      return res.status(200).json(results);
    } catch (err) {
      console.log(err);
      return sendErrorResponse(res, 500);
    }
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

referenceRouter.get(
  "/publication-series",
  referenceHandler(() => ReferenceService.getPublicationSeries()),
);

export { referenceRouter };
