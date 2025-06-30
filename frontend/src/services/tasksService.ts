import { api } from './api';
import type { Task } from '../types';

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assigneeId?: string;
}

export interface TaskFilters {
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// Tasks API
export const tasksService = {
  // Get all tasks for the current user
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data.data.tasks;
  },

  // Get tasks for a specific project
  getProjectTasks: async (projectId: string, filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await api.get(`/tasks/project/${projectId}?${params.toString()}`);
    return response.data.data.tasks;
  },

  // Get a specific task by ID
  getTask: async (taskId: string): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data.data.task;
  },

  // Create a new task
  createTask: async (taskData: CreateTaskData): Promise<Task> => {
    const response = await api.post('/tasks', taskData);
    return response.data.data.task;
  },

  // Update a task
  updateTask: async (taskId: string, taskData: UpdateTaskData): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data.data.task;
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },
};
