import axios from 'axios';
// import { LoginCredentials, RegisterData, User, AuthResponse } from '../types/auth';
import type { AuthResponse } from '../types';
import type { RegisterData } from '../types';
import type { User } from '../types';
import type { LoginCredentials } from '../types';


const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

export { api };
