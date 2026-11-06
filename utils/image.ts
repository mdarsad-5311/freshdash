import { API_BASE_URL } from '../constants/config';

/**
 * Resolves a product or category image URL into a fully-qualified URI.
 * - Absolute URLs (http://, https://) are returned unchanged.
 * - Relative media paths (/media/... or media/...) are prepended with the backend server origin.
 * - Empty, undefined, or null values return null to trigger sprite-atlas fallback.
 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // Already absolute or local scheme
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:')
  ) {
    return trimmed;
  }

  // Derive backend origin by removing /api/v1 from API_BASE_URL
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }

  return `${origin}/${trimmed}`;
}

