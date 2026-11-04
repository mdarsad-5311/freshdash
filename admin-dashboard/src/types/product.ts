export interface AdminProduct {
  id: string;
  name: string;
  weight: string;
  price: string;
  original: string;
  discount_percentage: number;
  photo: number;
  category: string;
  category_name: string;
  popular: boolean;
  organic: boolean;
  description: string;
  stock: number;
  image: string | null;
  is_available: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  id?: string;
  name: string;
  weight: string;
  price: string | number;
  original: string | number;
  category: string;
  popular?: boolean;
  organic?: boolean;
  description?: string;
  stock: number;
  is_available?: boolean;
  image?: File | null;
}

export interface ProductFilterParams {
  category?: string;
  is_available?: boolean | string;
  stock_status?: 'low_stock' | 'out_of_stock' | 'in_stock' | '';
  search?: string;
  ordering?: string;
  page?: number;
}

