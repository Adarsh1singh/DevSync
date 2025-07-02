import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateTask, fetchTasks, fetchTaskComments } from '../store/slices/tasksSlice';
import { addNotification, fetchUnreadCount } from '../store/slices/notificationsSlice';
import { toast } from 'react-hot-toast';
import type { Task, Comment } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private joinedProjects = new Set<string>();

  connect(userId: string) {
    if (this.socket && this.isConnected) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.currentUserId = userId;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      
      // Join user's personal room for notifications
      if (this.currentUserId) {
        this.socket?.emit('join-user-room', this.currentUserId);
      }

      // Rejoin all project rooms
      this.joinedProjects.forEach(projectId => {
        this.socket?.emit('join-project', projectId);
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    // Task-related events
    this.socket.on('task-created', (data: { task: Task; createdBy: any }) => {
      console.log('Task created:', data);
      // Refresh tasks to include the new task
      store.dispatch(fetchTasks({}));

      if (data.createdBy.id !== this.currentUserId) {
        toast.success(`New task created: ${data.task.title}`);
      }
    });

    this.socket.on('task-updated', (data: { task: Task; updatedBy: any }) => {
      console.log('Task updated:', data);
      // Update the task in the store
      store.dispatch(updateTask.fulfilled(data.task, '', { taskId: data.task.id, taskData: {} }));
      
      if (data.updatedBy.id !== this.currentUserId) {
        toast.success(`Task updated: ${data.task.title}`);
      }
    });

    this.socket.on('task-deleted', (data: { taskId: string; deletedBy: any }) => {
      console.log('Task deleted:', data);
      // Refresh tasks to remove the deleted task
      store.dispatch(fetchTasks({}));

      if (data.deletedBy.id !== this.currentUserId) {
        toast.success('A task was deleted');
      }
    });

    // Comment-related events
    this.socket.on('comment-added', (data: { comment: Comment; task: { id: string; title: string } }) => {
      console.log('Comment added:', data);
      
      // Refresh comments for the task if it's currently being viewed
      const currentTask = store.getState().tasks.currentTask;
      if (currentTask && currentTask.id === data.task.id) {
        store.dispatch(fetchTaskComments(data.task.id));
      }
      
      if (data.comment.user.id !== this.currentUserId) {
        toast.success(`New comment on: ${data.task.title}`);
      }
    });

    this.socket.on('comment-updated', (data: { comment: Comment }) => {
      console.log('Comment updated:', data);
      
      // Refresh comments for the task if it's currently being viewed
      const currentTask = store.getState().tasks.currentTask;
      if (currentTask && data.comment.taskId === currentTask.id) {
        store.dispatch(fetchTaskComments(currentTask.id));
      }
    });

    this.socket.on('comment-deleted', (data: { commentId: string; taskId: string }) => {
      console.log('Comment deleted:', data);
      
      // Refresh comments for the task if it's currently being viewed
      const currentTask = store.getState().tasks.currentTask;
      if (currentTask && currentTask.id === data.taskId) {
        store.dispatch(fetchTaskComments(data.taskId));
      }
    });

    // Label-related events
    this.socket.on('label-created', (data: { label: any; createdBy: any }) => {
      console.log('Label created:', data);
      
      if (data.createdBy.id !== this.currentUserId) {
        toast.success(`New label created: ${data.label.name}`);
      }
    });

    this.socket.on('label-deleted', (data: { labelId: string; deletedBy: any }) => {
      console.log('Label deleted:', data);
      
      if (data.deletedBy.id !== this.currentUserId) {
        toast.success('A label was deleted');
      }
    });

    this.socket.on('task-label-assigned', (data: { task: Task; label: any; assignedBy: any }) => {
      console.log('Label assigned to task:', data);
      
      // Update the task in the store
      store.dispatch(updateTask.fulfilled(data.task, '', { taskId: data.task.id, taskData: {} }));
      
      if (data.assignedBy.id !== this.currentUserId) {
        toast.success(`Label "${data.label.name}" assigned to: ${data.task.title}`);
      }
    });

    this.socket.on('task-label-removed', (data: { task: Task; labelId: string; removedBy: any }) => {
      console.log('Label removed from task:', data);
      
      // Update the task in the store
      store.dispatch(updateTask.fulfilled(data.task, '', { taskId: data.task.id, taskData: {} }));
      
      if (data.removedBy.id !== this.currentUserId) {
        toast.success(`Label removed from: ${data.task.title}`);
      }
    });

    // Notification events
    this.socket.on('notification', (notification: any) => {
      console.log('Notification received:', notification);

      // Add to notifications store
      store.dispatch(addNotification(notification));

      // Update unread count
      store.dispatch(fetchUnreadCount());

      // Show toast notification
      toast.success(notification.title);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
      this.joinedProjects.clear();
    }
  }

  joinProject(projectId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-project', projectId);
      this.joinedProjects.add(projectId);
      console.log(`Joined project room: ${projectId}`);
    }
  }

  leaveProject(projectId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-project', projectId);
      this.joinedProjects.delete(projectId);
      console.log(`Left project room: ${projectId}`);
    }
  }

  // Emit events
  emitTaskUpdate(data: { task: Task; projectId: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('task-updated', data);
    }
  }

  emitCommentAdded(data: { comment: Comment; projectId: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('comment-added', data);
    }
  }

  emitNotification(data: { userId: string; title: string; message: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification', data);
    }
  }

  isSocketConnected() {
    return this.isConnected;
  }

  getSocket() {
    return this.socket;
  }
}

// Create a singleton instance
export const socketService = new SocketService();
export default socketService;
