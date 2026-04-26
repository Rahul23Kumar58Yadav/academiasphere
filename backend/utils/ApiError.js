'use strict';
class ApiError extends Error {
  /**
   * @param {number}   statusCode  - HTTP status code
   * @param {string}   message     - Human-readable message
   * @param {string[]} [errors]    - Optional array of field-level error strings
   * @param {string}   [stack]     - Optional pre-built stack trace
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
 
    this.statusCode = statusCode;
    this.message    = message;
    this.success    = false;
    this.errors     = errors;
 
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
 
module.exports = ApiError;