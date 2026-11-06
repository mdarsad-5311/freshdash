/**
 * Frontend normalized FAQ item.
 */
export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  order: number;
}

/**
 * Backend DRF raw serialized FAQ item.
 */
export interface RawFAQItem {
  id: number;
  question: string;
  answer: string;
  order?: number;
}

/**
 * Transform raw backend FAQ item into frontend FAQItem.
 */
export function transformFAQ(raw: RawFAQItem): FAQItem {
  return {
    id: raw.id,
    question: raw.question || '',
    answer: raw.answer || '',
    order: typeof raw.order === 'number' ? raw.order : 0,
  };
}

