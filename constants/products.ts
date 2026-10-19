export interface Product {
  id: string;
  name: string;
  weight: string;
  price: number;
  original: number;
  photo: number;
  category: string;
  popular?: boolean;
  organic?: boolean;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  photo: number;
  tint: string;
}

export const products: Product[] = [
  {
    id: 'tomato',
    name: 'Fresh red tomatoes',
    weight: '500 g',
    price: 28,
    original: 36,
    photo: 0,
    category: 'vegetables',
    popular: true,
    description: 'Firm, juicy tomatoes with a bright, naturally tangy flavour. Perfect for everyday curries, salads and homemade sauces.',
  },
  {
    id: 'potato',
    name: 'Farm fresh potatoes',
    weight: '1 kg',
    price: 35,
    original: 45,
    photo: 1,
    category: 'roots',
    popular: true,
    description: 'Versatile potatoes with smooth skin and a soft, fluffy texture when cooked. Your everyday kitchen essential.',
  },
  {
    id: 'onion',
    name: 'Red onions',
    weight: '1 kg',
    price: 42,
    original: 55,
    photo: 2,
    category: 'roots',
    popular: true,
    description: 'Crisp red onions with a bold flavour, handpicked for your daily cooking.',
  },
  {
    id: 'broccoli',
    name: 'Fresh green broccoli',
    weight: '1 pc · 250–350 g',
    price: 65,
    original: 85,
    photo: 3,
    category: 'exotic-vegetables',
    organic: true,
    description: 'Tender, vibrant florets that are lovely steamed, stir-fried or roasted with a little olive oil.',
  },
  {
    id: 'banana',
    name: 'Banana Robusta',
    weight: '6 pcs',
    price: 48,
    original: 60,
    photo: 4,
    category: 'fruits',
    popular: true,
    description: 'Naturally sweet, creamy bananas. A delicious breakfast companion or an easy on-the-go snack.',
  },
  {
    id: 'apple',
    name: 'Royal Gala apples',
    weight: '4 pcs · 500–600 g',
    price: 149,
    original: 189,
    photo: 5,
    category: 'fruits',
    popular: true,
    description: 'Crunchy, aromatic apples with a lovely balance of sweetness and freshness.',
  },
  {
    id: 'mango',
    name: 'Alphonso mangoes',
    weight: '2 pcs · 500 g',
    price: 199,
    original: 249,
    photo: 6,
    category: 'seasonal',
    popular: true,
    description: 'Golden mangoes with fragrant, rich flesh. Enjoy chilled, in a smoothie or straight from the slice.',
  },
  {
    id: 'avocado',
    name: 'Premium Hass avocado',
    weight: '1 pc',
    price: 129,
    original: 159,
    photo: 7,
    category: 'exotic-fruits',
    organic: true,
    description: 'Rich, buttery avocado with a creamy texture. Delicious on toast, in salads or as a fresh guacamole.',
  },
  {
    id: 'spinach',
    name: 'Fresh spinach (Palak)',
    weight: '250 g',
    price: 25,
    original: 35,
    photo: 8,
    category: 'leafy',
    organic: true,
    description: 'Tender green leaves, carefully selected for freshness. Rinse thoroughly before cooking.',
  },
  {
    id: 'carrot',
    name: 'Crunchy orange carrots',
    weight: '500 g',
    price: 39,
    original: 50,
    photo: 9,
    category: 'roots',
    organic: true,
    description: 'Sweet, crunchy carrots for colourful salads, soups and a wholesome snack.',
  },
  {
    id: 'pepper',
    name: 'Colourful bell peppers — assorted',
    weight: '3 pcs · 400–500 g',
    price: 89,
    original: 110,
    photo: 10,
    category: 'exotic-vegetables',
    description: 'A colourful mix of crisp bell peppers. Add a fresh crunch to stir-fries, wraps and roasted vegetables.',
  },
  {
    id: 'lemon',
    name: 'Fresh lemons',
    weight: '4 pcs',
    price: 29,
    original: 40,
    photo: 11,
    category: 'herbs',
    description: 'Bright, juicy lemons for a refreshing squeeze in drinks, dressings and everyday meals.',
  },
];

export const categories: Category[] = [
  { id: 'vegetables', name: 'Fresh vegetables', photo: 0, tint: '#EEF4E8' },
  { id: 'fruits', name: 'Fresh fruits', photo: 5, tint: '#FFF0E8' },
  { id: 'leafy', name: 'Leafy vegetables', photo: 8, tint: '#EAF3E5' },
  { id: 'roots', name: 'Root vegetables', photo: 9, tint: '#FFF0E3' },
  { id: 'exotic-vegetables', name: 'Exotic vegetables', photo: 3, tint: '#EBF0E5' },
  { id: 'seasonal', name: 'Seasonal fruits', photo: 6, tint: '#FFF4D9' },
  { id: 'organic', name: 'Organic produce', photo: 10, tint: '#EEF2E2' },
  { id: 'herbs', name: 'Herbs and chillies', photo: 11, tint: '#F8F5DD' },
  { id: 'exotic-fruits', name: 'Exotic fruits', photo: 7, tint: '#F0F3E5' },
];

export const FEATURED_VEGETABLE_IDS = ['tomato', 'potato', 'onion', 'broccoli', 'carrot'] as const;
export const FEATURED_FRUIT_IDS = ['banana', 'apple', 'mango', 'avocado'] as const;

export const getFeaturedVegetables = (): Product[] =>
  products.filter((p) => (FEATURED_VEGETABLE_IDS as readonly string[]).includes(p.id));

export const getFeaturedFruits = (): Product[] =>
  products.filter((p) => (FEATURED_FRUIT_IDS as readonly string[]).includes(p.id));

export const getBestsellers = (): Product[] =>
  products.filter((p) => p.popular);

export const getSeasonalProduct = (): Product | undefined =>
  products.find((p) => p.category === 'seasonal');

export function categoryProducts(categoryId: string): Product[] {
  if (categoryId === 'all') return products;
  if (categoryId === 'vegetables') {
    return products.filter((p) => !['fruits', 'seasonal', 'exotic-fruits'].includes(p.category));
  }
  if (categoryId === 'fruits') {
    return products.filter((p) => ['fruits', 'seasonal', 'exotic-fruits'].includes(p.category));
  }
  if (categoryId === 'organic') {
    return products.filter((p) => p.organic);
  }
  return products.filter((p) => p.category === categoryId);
}

export function formatCurrency(amount: number): string {
  return `₹${amount}`;
}

export function calculateDiscount(price: number, original: number): number {
  if (!original || original <= price) return 0;
  return Math.round(100 * (1 - price / original));
}

// Backward compatibility alias
export const money = formatCurrency;
