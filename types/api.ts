/**
 * Standard API error response shape returned by FreshDash Django backend.
 */
export interface BackendErrorResponse {
  success?: boolean;
  status_code?: number;
  message?: string;
  errors?: Record<string, string[] | string>;
  detail?: string;
  [key: string]: unknown;
}

/**
 * Normalized application-level API error for consistent UI handling.
 */
export interface NormalizedApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[] | string>;
  isNetworkError: boolean;
  isAuthError: boolean;
  isServerError: boolean;
  originalError: unknown;
}

/**
 * Generic standard API success response wrapper.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

/**
 * Standard Django REST Framework paginated list response.
 */
export interface PaginatedResponse<T> {
  count: number;
  total_pages?: number;
  current_page?: number;
  page_size?: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

