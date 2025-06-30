import axios from 'axios';
import type { Team, CreateTeamData, UpdateTeamData } from '../types';

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

// Teams API
export const teamsService = {
  // Get all teams for the current user
  getTeams: async (): Promise<Team[]> => {
    const response = await api.get('/teams');
    return response.data.data.teams;
  },

  // Get a specific team by ID
  getTeam: async (teamId: string): Promise<Team> => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data.data.team;
  },

  // Create a new team
  createTeam: async (teamData: CreateTeamData): Promise<Team> => {
    const response = await api.post('/teams', teamData);
    return response.data.data.team;
  },

  // Update a team
  updateTeam: async (teamId: string, teamData: UpdateTeamData): Promise<Team> => {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data.data.team;
  },

  // Delete a team
  deleteTeam: async (teamId: string): Promise<void> => {
    await api.delete(`/teams/${teamId}`);
  },

  // Add member to team
  addTeamMember: async (teamId: string, email: string, role?: string): Promise<void> => {
    await api.post(`/teams/${teamId}/members`, { email, role });
  },

  // Remove member from team
  removeTeamMember: async (teamId: string, memberId: string): Promise<void> => {
    await api.delete(`/teams/${teamId}/members/${memberId}`);
  },

  // Get team activity
  getTeamActivity: async (teamId: string): Promise<any[]> => {
    const response = await api.get(`/teams/${teamId}/activity`);
    return response.data.data.activities;
  },

  // Get global team activity for user
  getGlobalTeamActivity: async (): Promise<any[]> => {
    const response = await api.get('/teams/activity');
    return response.data.data.activities;
  },
};
