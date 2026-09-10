import { Response } from 'express'
import z from 'zod'

export interface ErrorOptions {
  errCode?: string | null
  userMessage?: string | null
  developerMessage?: string | null
}

export interface ApiErrorBody {
  error: {
    code?: string
    userMessage?: string
    developerMessage?: string
  }
}

/**
 * Sends a standardized JSON error response.
 *
 * Per-status defaults (applied when the caller omits the corresponding option):
 *   - 400: code defaults to 'INVALID_REQUEST'
 *   - 401: code defaults to 'UNAUTHORIZED', userMessage defaults to 'Not authorized'
 *   - 403: code defaults to 'FORBIDDEN'
 *   - 404: code defaults to 'NOT_FOUND'
 *   - 5xx: code defaults to 'INTERNAL_ERROR'
 *
 * Pass `null` for any option to explicitly suppress its default.
 *
 * @param res            - Express Response object
 * @param httpStatusCode - HTTP status code
 * @param options        - Optional error attributes; null suppresses the default; undefined uses the default
 */
export function sendErrorResponse(
  res: Response,
  httpStatusCode: number,
  options: ErrorOptions = {},
): Response {
  const { errCode, userMessage, developerMessage } = options

  const error: ApiErrorBody['error'] = {}

  // Resolve error code: explicit value > per-status default
  let defaultCode: string | undefined
  if (httpStatusCode >= 500) {
    defaultCode = 'INTERNAL_ERROR'
  } else if (httpStatusCode === 401) {
    defaultCode = 'UNAUTHORIZED'
  } else if (httpStatusCode === 403) {
    defaultCode = 'FORBIDDEN'
  } else if (httpStatusCode === 404) {
    defaultCode = 'NOT_FOUND'
  } else if (httpStatusCode === 400) {
    defaultCode = 'INVALID_REQUEST'
  }
  const resolvedCode = errCode !== undefined ? errCode : defaultCode
  if (resolvedCode != null) {
    error.code = resolvedCode
  }

  // Resolve user message: explicit value > per-status default
  const defaultUserMessage = httpStatusCode === 401 ? 'Not authorized' : undefined
  const resolvedUserMessage = userMessage !== undefined ? userMessage : defaultUserMessage
  if (resolvedUserMessage != null) {
    error.userMessage = resolvedUserMessage
  }

  if (developerMessage != null) {
    error.developerMessage = developerMessage
  }

  const body: ApiErrorBody = { error }
  return res.status(httpStatusCode).json(body)
}

export function sendZodErrorResponse(res: Response, error: z.ZodError) {
  return sendErrorResponse(res, 400, {
    errCode: 'VALIDATION_ERROR',
    developerMessage: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  })
}
