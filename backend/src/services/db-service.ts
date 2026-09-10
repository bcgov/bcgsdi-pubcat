import { prisma } from '../core/prisma.js'

/* Provides access to general purpose information from the configured database */

export const DbService = {
  async getDbSearchPath(): Promise<string | null> {
    const result: [{ search_path: string }] = await prisma.$queryRaw`SHOW search_path`
    if (result?.length) {
      return result[0]?.search_path
    }
    return null
  },
}
