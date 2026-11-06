import { api, normalizeApiError } from './api';
import { API_ENDPOINTS } from '../constants/config';
import { FAQItem, RawFAQItem, transformFAQ } from '../types/faq';
import { PaginatedResponse } from '../types/api';

export const faqService = {
  async getFAQs(): Promise<FAQItem[]> {
    try {
      const response = await api.get<PaginatedResponse<RawFAQItem> | RawFAQItem[]>(
        API_ENDPOINTS.FAQS
      );

      const data = response.data;

      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results.map(transformFAQ);
      }

      if (Array.isArray(data)) {
        return data.map(transformFAQ);
      }

      return [];
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};
