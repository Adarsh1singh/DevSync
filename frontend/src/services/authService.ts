import { api } from './api';
import type { AuthResponse } from '../types';
import type { RegisterData } from '../types';
import type { User } from '../types';
import type { LoginCredentials } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getProfile(): Promise<{ data: { user: User } }> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(userData: Partial<User>): Promise<{ data: { user: User } }> {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.put('/auth/change-password', passwordData);
  },
};


