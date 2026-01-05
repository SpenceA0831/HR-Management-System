import { apiClient } from './apiClient';
import type { ApiResponse, User } from '../../types';

/**
 * Get demo users for the login page (public endpoint - no auth required)
 */
export async function getDemoUsers(): Promise<ApiResponse<User[]>> {
  return apiClient.get<User[]>('getDemoUsers');
}

/**
 * Get all users from the system (admin only)
 */
export async function getUsers(): Promise<ApiResponse<User[]>> {
  return apiClient.get<User[]>('getUsers');
}

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiClient.get<User>('getCurrentUser');
}

/**
 * Create a new user (Admin only)
 */
export async function createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
  return apiClient.post<User>('createUser', userData);
}
