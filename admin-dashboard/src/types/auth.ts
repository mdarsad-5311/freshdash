export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff' | string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  phone_number: string;
  date_joined: string;
  last_login: string | null;
}

export interface AdminTokens {
  access: string;
  refresh: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  tokens: AdminTokens;
  token: string;
  user: AdminUser;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  tokens: {
    access: string;
    refresh?: string;
  };
  access?: string;
  refresh?: string;
}

