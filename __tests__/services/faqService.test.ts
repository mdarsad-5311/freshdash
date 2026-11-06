import { faqService } from '../../services/faqService';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/config';
import { RawFAQItem } from '../../types/faq';

const mockRawFaqs: RawFAQItem[] = [
  {
    id: 1,
    question: 'How fast is delivery?',
    answer: 'Produce arrives in 10-15 minutes.',
    order: 1,
  },
  {
    id: 2,
    question: 'Is the produce fresh?',
    answer: 'Harvested daily directly from local farmers.',
    order: 2,
  },
];

describe('faqService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFAQs', () => {
    it('fetches and transforms DRF paginated FAQs', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: {
          count: 2,
          total_pages: 1,
          current_page: 1,
          page_size: 20,
          next: null,
          previous: null,
          results: mockRawFaqs,
        },
      });

      const faqs = await faqService.getFAQs();

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.FAQS);
      expect(faqs).toHaveLength(2);
      expect(faqs[0].id).toBe(1);
      expect(faqs[0].question).toBe('How fast is delivery?');
      expect(faqs[0].answer).toBe('Produce arrives in 10-15 minutes.');
      expect(faqs[1].id).toBe(2);
    });

    it('handles flat array responses gracefully', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockRawFaqs,
      });

      const faqs = await faqService.getFAQs();
      expect(faqs).toHaveLength(2);
      expect(faqs[0].question).toBe('How fast is delivery?');
    });

    it('returns empty array when response is empty', async () => {
      jest.spyOn(api, 'get').mockResolvedValueOnce({
        data: { results: [] },
      });

      const faqs = await faqService.getFAQs();
      expect(faqs).toEqual([]);
    });

    it('normalizes and throws API errors', async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal server error.' },
        },
      };
      jest.spyOn(api, 'get').mockRejectedValueOnce(errorResponse);

      await expect(faqService.getFAQs()).rejects.toMatchObject({
        statusCode: 500,
        isServerError: true,
      });
    });
  });
});

