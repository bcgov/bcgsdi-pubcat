import express, { Request, Response } from "express";
import { z } from "zod";
import {
  sendErrorResponse,
  sendZodErrorResponse,
} from "../core/error-handling.js";
import { handleAsync } from "../core/express-middleware.js";
import { PublicationService } from "../services/publication-service.js";
import { UserInputError } from "../types/error.js";
import {
  PublicationFilter,
  PublicationFilterClause,
  publicationSearchBodySchema,
} from "../types/publication.js";

const publicationRouter = express.Router({ mergeParams: true });

/**
 * POST /publications/search
 * Accepts a search filter and sort object in the JSON body.
 * Returns a paginated list of publications matching the provided criteria.
 */
publicationRouter.post(
  "/search",
  handleAsync(async (req: Request, res: Response) => {
    const parsed = publicationSearchBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendZodErrorResponse(res, parsed.error);
    }

    const { filter, sort, offset, limit } = parsed.data;

    try {
      const results = await PublicationService.searchPublications(
        filter as PublicationFilter | PublicationFilterClause[] | undefined,
        sort,
        offset,
        limit,
      );
      return res.status(200).json(results);
    } catch (err: any) {
      if (err instanceof UserInputError) {
        return sendErrorResponse(res, 400, { userMessage: err.message });
      }
      console.log(err);
      return sendErrorResponse(res, 500);
    }
  }),
);

/**
 * GET /publications/:id
 * Returns the publication with the given GUID.
 */
publicationRouter.get(
  "/:id",
  handleAsync(async (req: Request, res: Response) => {
    const paramsSchema = z.object({
      id: z.string().uuid({ message: "id must be a valid UUID." }),
    });
    const parsedParams = paramsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return sendZodErrorResponse(res, parsedParams.error);
    }

    const { id } = parsedParams.data;

    try {
      const publication = await PublicationService.getPublication(id);
      if (!publication) {
        return sendErrorResponse(res, 404, {
          userMessage: "Publication not found.",
        });
      }
      return res.status(200).json(publication);
    } catch (err: any) {
      console.log(err);
      return sendErrorResponse(res, 500);
    }
  }),
);

export { publicationRouter };
