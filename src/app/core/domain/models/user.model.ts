export type UserRole = 'vecino' | 'admin' | 'vigilancia';

export interface CurrentUser {
  id: string;
  phone: string;
  role: UserRole;
}

export interface UserAddress {
  street: string;
  number: string;
  letter?: string | null;
}

export interface UserProfile {
  id: string;
  phone: string;
  role: UserRole;
  status: string;
  address?: UserAddress | null;
}

export interface VigilanteListItem {
  id: string;
  phone: string;
  status: string;
  createdAt: string;
}

export interface VecinoListItem {
  id: string;
  phone: string;
  status: string;
  role?: 'vecino' | 'admin';
  street: string;
  number: string;
  letter?: string | null;
  createdAt: string;
}
