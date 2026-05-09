/**
 * Normalized API error types.
 * Every error from the API layer is normalized into one of these types.
 */
export const ErrorType = {
  CONFIG_ERROR: "config_error",
  NETWORK_ERROR: "network_error",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  VALIDATION_ERROR: "validation_error",
  SERVER_ERROR: "server_error",
  REQUEST_ERROR: "request_error",
};

/**
 * Create a normalized error object.
 * @param {object} params
 * @param {string} params.type - One of ErrorType values
 * @param {string} params.message - Human-readable message
 * @param {number|null} [params.status] - HTTP status code
 * @param {string} [params.path] - Request path
 * @param {*} [params.details] - Additional error details
 * @returns {{ type: string, message: string, status: number|null, path: string, details: * }}
 */
export function createError({ type, message, status = null, path = "", details = null }) {
  return { type, message, status, path, details };
}
