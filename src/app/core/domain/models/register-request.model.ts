export interface RegisterRequest {
  street: string;
  number: string;
  letter?: string;
  phone: string;
  password: string;
  deviceId: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
  deviceId: string;
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; phone: string; role: string };
}
