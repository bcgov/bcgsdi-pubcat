import { Request } from "express";

export const AuthService = {
  async ensureReqIsAuthenticated(req: Request) {
    throw new Error("Session is invalid");
  },

  doesReqHaveRole(req: Request, role: any | string): boolean {
    return false;
  },
};
