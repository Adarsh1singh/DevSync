import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Task, Comment, TaskLabel } from '../../types';
import { tasksService } from '../../services/tasksService';
import type { CreateTaskData, UpdateTaskData, TaskFilters, CreateCommentData, CreateTaskLabelData } from '../../services/tasksService';

interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  taskComments: Comment[];
  projectLabels: TaskLabel[];
  analytics: any | null;
  isLoading: boolean;
  isCommentsLoading: boolean;
  isLabelsLoading: boolean;
  isAnalyticsLoading: boolean;
  error: string | null;
  filters: TaskFilters;
}

const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  taskComments: [],
  projectLabels: [],
  analytics: null,
  isLoading: false,
  isCommentsLoading: false,
  isLabelsLoading: false,
  isAnalyticsLoading: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters: TaskFilters = {}, { rejectWithValue }) => {
    try {
      return await tasksService.getTasks(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchProjectTasks = createAsyncThunk(
  'tasks/fetchProjectTasks',
  async ({ projectId, filters }: { projectId: string; filters?: TaskFilters }, { rejectWithValue }) => {
    try {
      return await tasksService.getProjectTasks(projectId, filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project tasks');
    }
  }
);

export const fetchTask = createAsyncThunk(
  'tasks/fetchTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      return await tasksService.getTask(taskId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskData, { rejectWithValue }) => {
    try {
      return await tasksService.createTask(taskData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData }: { taskId: string; taskData: UpdateTaskData }, { rejectWithValue }) => {
    try {
      return await tasksService.updateTask(taskId, taskData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await tasksService.deleteTask(taskId);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

// Comments async thunks
export const fetchTaskComments = createAsyncThunk(
  'tasks/fetchTaskComments',
  async (taskId: string, { rejectWithValue }) => {
    try {
      return await tasksService.getTaskComments(taskId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const createTaskComment = createAsyncThunk(
  'tasks/createTaskComment',
  async (commentData: CreateCommentData, { rejectWithValue }) => {
    try {
      return await tasksService.createTaskComment(commentData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create comment');
    }
  }
);

export const deleteTaskComment = createAsyncThunk(
  'tasks/deleteTaskComment',
  async ({ taskId, commentId }: { taskId: string; commentId: string }, { rejectWithValue }) => {
    try {
      await tasksService.deleteTaskComment(taskId, commentId);
      return commentId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

// Labels async thunks
export const fetchProjectLabels = createAsyncThunk(
  'tasks/fetchProjectLabels',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await tasksService.getProjectLabels(projectId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch labels');
    }
  }
);

export const createTaskLabel = createAsyncThunk(
  'tasks/createTaskLabel',
  async (labelData: CreateTaskLabelData, { rejectWithValue }) => {
    try {
      return await tasksService.createTaskLabel(labelData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create label');
    }
  }
);

// Analytics async thunks
export const fetchTaskAnalytics = createAsyncThunk(
  'tasks/fetchTaskAnalytics',
  async ({ period, projectId }: { period?: 'week' | 'month' | 'quarter' | 'year'; projectId?: string }, { rejectWithValue }) => {
    try {
      return await tasksService.getTaskAnalytics(period, projectId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchProjectTaskAnalytics = createAsyncThunk(
  'tasks/fetchProjectTaskAnalytics',
  async ({ projectId, period }: { projectId: string; period?: 'week' | 'month' | 'quarter' | 'year' }, { rejectWithValue }) => {
    try {
      return await tasksService.getProjectTaskAnalytics(projectId, period);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project analytics');
    }
  }
);

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
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
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
        state.error = action.payload as string;
      })
      // Fetch project tasks
      .addCase(fetchProjectTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single task
      .addCase(fetchTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch task comments
      .addCase(fetchTaskComments.pending, (state) => {
        state.isCommentsLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskComments.fulfilled, (state, action) => {
        state.isCommentsLoading = false;
        state.taskComments = action.payload;
      })
      .addCase(fetchTaskComments.rejected, (state, action) => {
        state.isCommentsLoading = false;
        state.error = action.payload as string;
      })
      // Create task comment
      .addCase(createTaskComment.fulfilled, (state, action) => {
        state.taskComments.push(action.payload);
      })
      // Delete task comment
      .addCase(deleteTaskComment.fulfilled, (state, action) => {
        state.taskComments = state.taskComments.filter(comment => comment.id !== action.payload);
      })
      // Fetch project labels
      .addCase(fetchProjectLabels.pending, (state) => {
        state.isLabelsLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectLabels.fulfilled, (state, action) => {
        state.isLabelsLoading = false;
        state.projectLabels = action.payload;
      })
      .addCase(fetchProjectLabels.rejected, (state, action) => {
        state.isLabelsLoading = false;
        state.error = action.payload as string;
      })
      // Create task label
      .addCase(createTaskLabel.fulfilled, (state, action) => {
        state.projectLabels.push(action.payload);
      })
      // Fetch task analytics
      .addCase(fetchTaskAnalytics.pending, (state) => {
        state.isAnalyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskAnalytics.fulfilled, (state, action) => {
        state.isAnalyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchTaskAnalytics.rejected, (state, action) => {
        state.isAnalyticsLoading = false;
        state.error = action.payload as string;
      })
      // Fetch project task analytics
      .addCase(fetchProjectTaskAnalytics.pending, (state) => {
        state.isAnalyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectTaskAnalytics.fulfilled, (state, action) => {
        state.isAnalyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchProjectTaskAnalytics.rejected, (state, action) => {
        state.isAnalyticsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentTask, clearError, setFilters, clearFilters } = tasksSlice.actions;
export default tasksSlice.reducer;
