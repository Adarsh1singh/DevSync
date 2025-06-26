import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { Team } from '../../types';
import type { Team } from '../../types';

interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TeamsState = {
  teams: [],
  currentTeam: null,
  isLoading: false,
  error: null,
};

// Placeholder async thunks - will be implemented later
export const fetchTeams = createAsyncThunk('teams/fetchTeams', async () => {
  // TODO: Implement API call
  return [];
});

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setCurrentTeam: (state, action) => {
      state.currentTeam = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teams = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch teams';
      });
  },
});

export const { setCurrentTeam, clearError } = teamsSlice.actions;
export default teamsSlice.reducer;
