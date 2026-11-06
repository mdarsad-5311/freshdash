import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import { FAQItem, RawFAQItem, transformFAQ } from '../types/faq';
import { PaginatedResponse } from '../types/api';

export const faqService = {
  /**
   * Fetch frequently asked questions for Help & Support.
   */
  async getFAQs(): Promise<FAQItem[]> {
    try {
      const response = await api.get<PaginatedResponse<RawFAQItem> | RawFAQItem[]>(
        API_ENDPOINTS.FAQS
      );

      const data = response.data;

      // Standard DRF paginated response
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results.map(transformFAQ);
      }

      // Flat array fallback
      if (Array.isArray(data)) {
        return data.map(transformFAQ);
      }

      return [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};

