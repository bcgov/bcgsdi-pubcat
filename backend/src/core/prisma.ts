import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { config } from './config.js'

// Create a single shared instance of the generated PrismaClient.
// PrismaPg is required in Prisma v7 as a driver adapter.  The 'schema'
// option sets the PostgreSQL search_path so that *most* queries are scoped
// to the 'pubcat' schema.  Some queries don't use the schema from the adapter.
// Because of this it's also a good idea of the db url contains the schema
// in the query string like: ?options=-csearch_path%3Dpubcat`
const adapter = new PrismaPg(
  { connectionString: config.get('db:url') },
  { schema: config.get('db:schema') },
)
const prisma = new PrismaClient({
  adapter,
  //log: ['query']
})

export { prisma }
