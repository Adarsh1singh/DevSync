import { api } from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId: string;
  metadata?: {
    taskId?: string;
    projectId?: string;
    commentId?: string;
    actionType?: string;
  };
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: string;
  metadata?: {
    taskId?: string;
    projectId?: string;
    commentId?: string;
    actionType?: string;
  };
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  limit?: number;
  offset?: number;
}

// Notifications API
export const notificationsService = {
  // Get user's notifications
  getNotifications: async (filters?: NotificationFilters): Promise<{ notifications: Notification[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count;
  },

  // Create notification (admin only)
  createNotification: async (notificationData: CreateNotificationData): Promise<Notification> => {
    const response = await api.post('/notifications', notificationData);
    return response.data.data.notification;
  },

  // Get notification preferences
  getPreferences: async (): Promise<any> => {
    const response = await api.get('/notifications/preferences');
    return response.data.data.preferences;
  },

  // Update notification preferences
  updatePreferences: async (preferences: any): Promise<any> => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data.data.preferences;
  },
};
