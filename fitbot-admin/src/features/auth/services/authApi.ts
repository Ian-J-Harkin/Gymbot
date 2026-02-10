
import api from '../../../services/api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../../../types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  },

  validateToken: async (): Promise<User | null> => {
    try {
      const response = await api.get<User>('/auth/profile');
      return response.data;
    } catch {
      return null;
    }
  },
};