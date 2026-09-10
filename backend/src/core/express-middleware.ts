import { NextFunction, Request, Response } from 'express'
import { AuthService } from '../services/auth-service.js'
import { sendErrorResponse } from './error-handling.js'
import { logger } from './logger.js'

export const handleAsync = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const logRequests = async function (req: Request, res: Response, next: NextFunction) {
  const excludedPaths = ['/api/metrics', '/api/health']

  //only log requests that don't match any 'excludedPaths'
  if (!excludedPaths.some((prefix) => req.path.startsWith(prefix))) {
    logger.info(`${req.method} ${req.path}`, {})
  }
  next()
}

export const handleErrors = function (err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(err.stack)
  sendErrorResponse(res, 500)
  next()
}

/*
A middleware function to perform various checks of the user's session
to make sure it is valid.  Checks include:
  - The session's "AuthContext" is in a state consistent with an authenticated user
  - The access token associated with the AuthContext is not expired.
Usage:
  //Apply a role check to all routes in a given router
  myRouter.use(handleAsync(hasRole(Role.Editor)));

  //apply a role check to one specific route
  personRouter.get(
    '/:id',
    hasRole(Role.Editor),
    handleAsync(async (req: Request, res: Response) => {
    ...
  })
*/
export const checkIsAuthenticated = async function (req: Request, res: Response, next: any) {
  try {
    await AuthService.ensureReqIsAuthenticated(req)
  } catch (e) {
    logger.debug(`Request does not have a valid session.`)

    return sendErrorResponse(res, 401)
  }
  //at this point, we've confirmed that the session is authorized.
  //proceed to the next handler.

  next()
}

/*
Returns a middleware function which does the following:
- calls checkIsAuthenticated, and
- (if checkIsAuthenticated passes), confirms that the user has the given role
*/
export const hasRole = function (roleToCheck: string) {
  return hasOneOfRoles([roleToCheck])
}

/*
Returns a middleware function which does the following:
- calls checkIsAuthenticated, and
- (if checkIsAuthenticated passes), confirms that the user has at least 
  one of the given roles
*/
export const hasOneOfRoles = function (rolesToCheck: string[]) {
  const onCheckAuthorizedComplete = async (req: Request, res: Response, next: any) => {
    let hasAtLeastOneRole = false
    for (const roleToCheck of rolesToCheck) {
      if (AuthService.doesReqHaveRole(req, roleToCheck)) {
        hasAtLeastOneRole = true
        break
      }
    }
    if (!hasAtLeastOneRole) {
      return sendErrorResponse(res, 401)
    }

    next()
  }
  return async (req: Request, res: Response, next: any) =>
    checkIsAuthenticated(req, res, () => {
      onCheckAuthorizedComplete(req, res, next)
    })
}
