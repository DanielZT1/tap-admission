export interface SessionUser {
  id: string;
  user_code: string;
  name: string;
  email: string;
  sections: string[];
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  brand: string;
  price: number;
  created_at: string;
}

export interface Profile {
  id: string;
  profile_code: string;
  name: string;
  section_keys?: string[];
  created_at: string;
}

export interface AppUser {
  id: string;
  user_code: string;
  email: string;
  name: string;
  phone?: string;
  profile_photo_path?: string;
  profiles?: Profile[];
  created_at: string;
}
