export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'owner' | 'employee';
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username?: string;
  password?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}
