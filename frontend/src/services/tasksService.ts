import { api } from './api';
import type { Task, Comment, TaskLabel } from '../types';

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
  search?: string;
  dueDate?: string;
  projectId?: string;
}

export interface CreateCommentData {
  content: string;
  taskId: string;
}

export interface CreateTaskLabelData {
  name: string;
  color: string;
  projectId: string;
}

// Tasks API
export const tasksService = {
  // Get all tasks for the current user
  getTasks: async (filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.dueDate) params.append('dueDate', filters.dueDate);
    if (filters?.projectId) params.append('projectId', filters.projectId);

    const response = await api.get(`/tasks/user?${params.toString()}`);
    return response.data.data.tasks;
  },

  // Get tasks for a specific project
  getProjectTasks: async (projectId: string, filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.dueDate) params.append('dueDate', filters.dueDate);

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

  // Task Comments
  getTaskComments: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data.data.comments;
  },

  createTaskComment: async (commentData: CreateCommentData): Promise<Comment> => {
    const response = await api.post(`/tasks/${commentData.taskId}/comments`, {
      content: commentData.content
    });
    return response.data.data.comment;
  },

  deleteTaskComment: async (taskId: string, commentId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },

  // Task Labels
  getProjectLabels: async (projectId: string): Promise<TaskLabel[]> => {
    const response = await api.get(`/projects/${projectId}/labels`);
    return response.data.data.labels;
  },

  createTaskLabel: async (labelData: CreateTaskLabelData): Promise<TaskLabel> => {
    const response = await api.post(`/projects/${labelData.projectId}/labels`, {
      name: labelData.name,
      color: labelData.color
    });
    return response.data.data.label;
  },

  deleteTaskLabel: async (projectId: string, labelId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/labels/${labelId}`);
  },

  // Assign/Remove labels to/from tasks
  assignLabelToTask: async (taskId: string, labelId: string): Promise<void> => {
    await api.post(`/tasks/${taskId}/labels/${labelId}`);
  },

  removeLabelFromTask: async (taskId: string, labelId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/labels/${labelId}`);
  },

  // Task Analytics
  getTaskAnalytics: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month', projectId?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('period', period);
    if (projectId) params.append('projectId', projectId);

    const response = await api.get(`/tasks/analytics?${params.toString()}`);
    return response.data.data;
  },

  getProjectTaskAnalytics: async (projectId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any> => {
    const params = new URLSearchParams();
    params.append('period', period);

    const response = await api.get(`/tasks/project/${projectId}/analytics?${params.toString()}`);
    return response.data.data;
  },
};
