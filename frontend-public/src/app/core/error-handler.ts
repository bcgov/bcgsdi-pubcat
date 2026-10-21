import { HttpErrorResponse } from '@angular/common/http';
import { NotFoundError, UserInputError } from '../types/error';

export const ErrorHandler = {
  /**
   * Maps an API error to a typed Error instance without throwing.
   * Use this when you need to store the error in a signal before rethrowing.
   *
   * Known limitation: if the .error attribute is of type Blob the error
   * message within that blob cannot currently be decoded by this function
   * because it requires use of the blob.text() method which is asyncronous.
   * That would require toApiError to become async also, would would complicate
   * the use of this function in some clients.  Instead, the implementation
   * works around blobs by recognizing that the only situation this app would
   * expect to receive a blob is from the "download" [search results] API endpoint.
   * The most likely error from that endpoint is a rate limit error (HTTP 429),
   * so we simply handle that status code with a pre-canned error message.
   *
   * @example
   * const apiError = ErrorHandler.toApiError(err);
   * this._error.set(apiError);
   * throw apiError;
   */
  toApiError: function (err: Error & { error?: any }): Error {
    if (err instanceof HttpErrorResponse) {
      if (err.status == 429) {
        return new UserInputError('Rate limit reached.  Try again later.');
      }
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
  throwApiError: function (err: Error): never {
    throw ErrorHandler.toApiError(err);
  },
};
