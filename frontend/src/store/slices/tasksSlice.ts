import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Task } from '../../types';

interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
};

// Placeholder async thunks - will be implemented later
export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
  // TODO: Implement API call
  return [];
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      });
  },
});

export const { setCurrentTask, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
