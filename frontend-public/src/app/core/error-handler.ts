import { HttpErrorResponse } from '@angular/common/http';
import { NotFoundError, UserInputError } from '../types/error';

export const ErrorHandler = {
  /**
   * Maps an API error to a typed Error instance without throwing.
   * Use this when you need to store the error in a signal before rethrowing.
   *
   * @example
   * const apiError = ErrorHandler.toApiError(err);
   * this._error.set(apiError);
   * throw apiError;
   */
  toApiError: function (err: any): Error {
    if (err instanceof HttpErrorResponse) {
      if (err.status == 400 || err.status == 409) {
        if (err.error?.error?.userMessage) {
          return new UserInputError(err.error?.error?.userMessage);
        }
      } else if (err.status == 404) {
        return new NotFoundError('Not found');
      }
    }
    return new Error('Something went wrong');
  },

  /**
   * Throws a typed API error. Use in catch blocks around HTTP calls.
   *
   * @example
   * try {
   *   return await firstValueFrom(this.http.get('/api/endpoint'));
   * } catch (err) {
   *   throw ErrorHandler.throwApiError(err);
   * }
   */
  throwApiError: function (err: any): never {
    throw ErrorHandler.toApiError(err);
  },
};
