import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { config } from './config.js';

// Create a single shared instance of the generated PrismaClient.
// PrismaPg's schema option configures the schema used by the adapter.
// Raw SQL queries that require a specific schema should qualify their
// table names explicitly, rather than relying on a connection-level
// search_path option in the connection URL.
const adapter = new PrismaPg(
  { connectionString: config.get('db:url') },
  { schema: config.get('db:schema') },
);

const prisma = new PrismaClient({
  adapter,
  // log: ['query'],
});

export { prisma };
