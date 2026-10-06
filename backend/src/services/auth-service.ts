import { Request } from 'express';

export const AuthService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ensureReqIsAuthenticated(req: Request) {
    throw new Error('Session is invalid');
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  doesReqHaveRole(req: Request, role: any | string): boolean {
    return false;
  },
};
