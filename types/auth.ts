export interface UserProfile {
  id?: number;
  phone_number?: string;
  order_updates?: boolean;
  offers_notifications?: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: UserProfile;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  order_updates?: boolean;
  offers_notifications?: boolean;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string; // Accepts email or username
  password: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  tokens?: AuthTokens;
  token?: string;
  user?: AuthUser;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  tokens: {
    access: string;
    refresh?: string;
  };
}

export interface ApiErrorResponse {
  success?: boolean;
  status_code?: number;
  message?: string;
  errors?: Record<string, string[] | string>;
  detail?: string;
}

