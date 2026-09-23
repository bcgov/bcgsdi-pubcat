import express from "express";
import rateLimit from "express-rate-limit";
import { healthRouter } from "./health-router.js";
import { publicationRouter } from "./publication-router.js";
import { referenceRouter } from "./reference-router.js";

const apiRouter = express.Router({ mergeParams: true });

const rateLimiter = rateLimit({
  windowMs: 60 * 1000, //1 minute
  limit: 400,
  standardHeaders: true,
  legacyHeaders: false,
});

apiRouter.use(rateLimiter);
apiRouter.use(express.json());

// Child routers
apiRouter.use("/health", healthRouter);
apiRouter.use("/publications", publicationRouter);
apiRouter.use("/references", referenceRouter);

export { apiRouter };
