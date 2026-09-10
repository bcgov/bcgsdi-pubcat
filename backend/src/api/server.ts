import express from "express";
import { config } from "../core/config.js";
import { logRequests } from "../core/express-middleware.js";
import { logger } from "../core/logger.js";
import { prisma } from "../core/prisma.js";
import { apiRouter } from "../routers/api-router.js";
import { DbService } from "../services/db-service.js";

logger.info(`Starting up`);
const port = config.get("server:port");

//-----------------------------------------------------------------------------

const app = express();
app.set("trust proxy", 1);

// Logging
//-----------------------------------------------------------------------------

app.use(logRequests);

// Routers
// ----------------------------------------------------------------------------

app.use("/api", apiRouter);

// Launch
// ----------------------------------------------------------------------------

const server = app.listen(port, async () => {
  // Initialize the DB connection pool (so we don't defer this until the first
  // query is performed.  that would slow down the first query significantly, and
  // could result in timeout errors.)
  const dbSearchPath = await DbService.getDbSearchPath();
  logger.info(
    `Connecting to database: ${config.get("db:urlObfuscatedPassword")} (searchPath=${dbSearchPath})`,
  );
  await prisma.$connect();
  logger.info(`Connected to database`);

  logger.info(`PubCat backend is ready and listening on port ${port}`);
  logger.info(
    `API URL: http://${config.get("environment") == "local" ? "localhost" : "HOST"}:${port}/api`,
  );
});

server.keepAliveTimeout = 60000;
server.headersTimeout = 61000;
