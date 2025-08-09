export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_PROVIDER'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'

export interface ApiErrorBody {
  error_code: ErrorCode
  message: string
  details?: unknown
}

export function errorResponse(error: ApiErrorBody, status: number): Response {
  return new Response(JSON.stringify(error), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

