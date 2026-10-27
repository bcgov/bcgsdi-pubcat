import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  buildApiErrorBody,
  sendErrorResponse,
  sendZodErrorResponse,
} from '../core/error-handling.js';
import { handleAsync } from '../core/express-middleware.js';
import { logger } from '../core/logger.js';
import { PublicationService } from '../services/publication-service.js';
import { UserInputError } from '../types/error.js';
import { Format } from '../types/export.js';
import {
  PublicationFilter,
  PublicationFilterClause,
  publicationSearchBodySchema,
  publicationSearchDownloadBodySchema,
} from '../types/publication.js';

const publicationRouter = express.Router({ mergeParams: true });

const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: buildApiErrorBody(429, {
    userMessage: 'Rate limit exceeded.  Try again after one hour',
  }),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /publications/search
 * Accepts a search filter and sort object in the JSON body.
 * Returns a paginated list of publications matching the provided criteria.
 */
publicationRouter.post(
  '/search',
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
 * POST /publications/download
 * Accepts a search filter and sort object in the JSON body.
 * Returns a file with all search results in the requested file format.
 */
publicationRouter.post(
  '/download',
  downloadLimiter,
  handleAsync(async (req: Request, res: Response) => {
    const parsed = publicationSearchDownloadBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendZodErrorResponse(res, parsed.error);
    }

    const { filter, sort } = parsed.data;

    try {
      if (req.accepts(Format.XLSX)) {
        const readableStream = await PublicationService.exportPublicationsToExcel(
          filter as PublicationFilter | PublicationFilterClause[] | undefined,
          sort,
        );
        res.setHeader('Content-Type', Format.XLSX);
        res.setHeader('Content-Disposition', 'attachment; filename="publication-search.xlsx"');

        readableStream.pipe(res);
      } else {
        throw new UserInputError('Invalid format');
      }
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
  '/:id',
  handleAsync(async (req: Request, res: Response) => {
    const paramsSchema = z.object({
      id: z.string().uuid({ message: 'id must be a valid UUID.' }),
    });
    const parsedParams = paramsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return sendErrorResponse(res, 404, {
        userMessage: 'Publication not found.',
      });
    }

    const { id } = parsedParams.data;

    try {
      const publication = await PublicationService.getPublication(id);
      if (!publication) {
        return sendErrorResponse(res, 404, {
          userMessage: 'Publication not found.',
        });
      }
      return res.status(200).json(publication);
    } catch (err: any) {
      logger.error('Error retrieving publication', {
        error: err,
        publicationGuid: id,
      });
      return sendErrorResponse(res, 500);
    }
  }),
);

export { publicationRouter };
