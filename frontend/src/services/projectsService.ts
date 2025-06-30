import axios from 'axios';
import type { Project } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateProjectData {
  name: string;
  description?: string;
  teamId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Projects API
export const projectsService = {
  // Get all projects for the current user
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data.data.projects;
  },

  // Get projects for a specific team
  getTeamProjects: async (teamId: string): Promise<Project[]> => {
    const response = await api.get(`/projects?teamId=${teamId}`);
    return response.data.data.projects;
  },

  // Get a specific project by ID
  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data.data.project;
  },

  // Create a new project
  createProject: async (projectData: CreateProjectData): Promise<Project> => {
    const response = await api.post('/projects', projectData);
    return response.data.data.project;
  },

  // Update a project
  updateProject: async (projectId: string, projectData: UpdateProjectData): Promise<Project> => {
    const response = await api.put(`/projects/${projectId}`, projectData);
    return response.data.data.project;
  },

  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },

  // Add member to project
  addProjectMember: async (projectId: string, userId: string, role?: string): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, { userId, role });
  },

  // Remove member from project
  removeProjectMember: async (projectId: string, memberId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${memberId}`);
  },

  // Get project activity
  getProjectActivity: async (projectId: string): Promise<any[]> => {
    const response = await api.get(`/projects/${projectId}/activity`);
    return response.data.data.activities;
  },
};
