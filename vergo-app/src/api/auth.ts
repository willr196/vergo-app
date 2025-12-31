/**
 * Authentication API Service
 * Updated to match VERGO backend format
 */

import apiClient, { setAuthTokens, clearAuthTokens, STORAGE_KEYS } from './client';
import * as SecureStore from 'expo-secure-store';
import type {
  LoginRequest,
  LoginResponse,
  RegisterJobSeekerRequest,
  RegisterClientRequest,
  JobSeeker,
  ClientCompany,
  UserType,
} from '../types';

// Backend response types (matching your API)
interface BackendAuthResponse {
  ok: boolean;
  error?: string;
  code?: string;
  user?: JobSeeker | ClientCompany;
  token?: string;
  refreshToken?: string;
}

export const authApi = {
  /**
   * Login for job seekers or clients
   * NOTE: Uses /api/v1/user/mobile/login endpoints which return JWT tokens
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const endpoint = credentials.userType === 'jobseeker' 
      ? '/api/v1/user/mobile/login' 
      : '/api/v1/client/mobile/login';
    
    const response = await apiClient.post<BackendAuthResponse>(endpoint, {
      email: credentials.email,
      password: credentials.password,
    });
    
    if (response.data.ok && response.data.token && response.data.user) {
      const { token, refreshToken, user } = response.data;
      
      // Store tokens
      await setAuthTokens(token, refreshToken || token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_TYPE, credentials.userType);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return {
        token,
        refreshToken: refreshToken || token,
        user,
        userType: credentials.userType,
      };
    }
    
    throw new Error(response.data.error || 'Login failed');
  },

  /**
   * Register a new job seeker
   */
  async registerJobSeeker(data: RegisterJobSeekerRequest): Promise<LoginResponse> {
    const response = await apiClient.post<BackendAuthResponse>('/api/v1/user/mobile/register', data);
    
    if (response.data.ok && response.data.token && response.data.user) {
      const { token, refreshToken, user } = response.data;
      
      await setAuthTokens(token, refreshToken || token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_TYPE, 'jobseeker');
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return {
        token,
        refreshToken: refreshToken || token,
        user,
        userType: 'jobseeker',
      };
    }
    
    throw new Error(response.data.error || 'Registration failed');
  },

  /**
   * Register a new client company
   */
  async registerClient(data: RegisterClientRequest): Promise<LoginResponse> {
    const response = await apiClient.post<BackendAuthResponse>('/api/v1/client/mobile/register', data);
    
    if (response.data.ok && response.data.token && response.data.user) {
      const { token, refreshToken, user } = response.data;
      
      await setAuthTokens(token, refreshToken || token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_TYPE, 'client');
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return {
        token,
        refreshToken: refreshToken || token,
        user,
        userType: 'client',
      };
    }
    
    throw new Error(response.data.error || 'Registration failed');
  },

  /**
   * Logout and clear all tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/user/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    
    await clearAuthTokens();
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(userType: UserType): Promise<JobSeeker | ClientCompany> {
    const endpoint = userType === 'jobseeker' ? '/api/v1/user/me' : '/api/v1/client/me';
    const response = await apiClient.get<BackendAuthResponse>(endpoint);
    
    if (response.data.ok && response.data.user) {
      return response.data.user;
    }
    
    throw new Error(response.data.error || 'Failed to get user');
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string, userType: UserType): Promise<void> {
    const endpoint = userType === 'jobseeker' 
      ? '/api/v1/user/forgot-password' 
      : '/api/v1/client/forgot-password';
    
    await apiClient.post(endpoint, { email });
  },

  /**
   * Update job seeker profile
   */
  async updateJobSeekerProfile(data: Partial<JobSeeker>): Promise<JobSeeker> {
    const response = await apiClient.put<BackendAuthResponse>('/api/v1/user/profile', data);
    
    if (response.data.ok && response.data.user) {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      return response.data.user as JobSeeker;
    }
    
    throw new Error(response.data.error || 'Failed to update profile');
  },

  /**
   * Update client company profile
   */
  async updateClientProfile(data: Partial<ClientCompany>): Promise<ClientCompany> {
    const response = await apiClient.put<BackendAuthResponse>('/api/v1/client/profile', data);
    
    if (response.data.ok && response.data.user) {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      return response.data.user as ClientCompany;
    }
    
    throw new Error(response.data.error || 'Failed to update profile');
  },

  /**
   * Check if user is authenticated (from stored tokens)
   */
  async checkAuth(): Promise<{ isAuthenticated: boolean; userType: UserType | null; user: JobSeeker | ClientCompany | null }> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const userType = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TYPE) as UserType | null;
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      
      if (token && userType && userData) {
        const user = JSON.parse(userData) as JobSeeker | ClientCompany;
        return { isAuthenticated: true, userType, user };
      }
      
      return { isAuthenticated: false, userType: null, user: null };
    } catch (error) {
      console.warn('Auth check failed:', error);
      return { isAuthenticated: false, userType: null, user: null };
    }
  },

  /**
   * Register push notification token
   */
  async registerPushToken(token: string): Promise<void> {
    await apiClient.post('/api/v1/notifications/register', { pushToken: token });
  },
};

export default authApi;
