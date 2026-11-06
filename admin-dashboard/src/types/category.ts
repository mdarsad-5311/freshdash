export interface AdminCategory {
  id: string;
  name: string;
  photo: number;
  tint: string;
  image: string | null;
  is_active: boolean;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  id?: string;
  name: string;
  photo?: number;
  tint?: string;
  is_active?: boolean;
  image?: File | null;
  remove_image?: boolean;
}

export interface CategoryFilterParams {
  search?: string;
  is_active?: boolean | string;
  ordering?: string;
}

