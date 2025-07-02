import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, MessageCircle, Tag, Edit, Trash2, Save, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTask,
  updateTask,
  deleteTask,
  fetchTaskComments,
  createTaskComment,
  deleteTaskComment,
  fetchProjectLabels,
  setCurrentTask
} from '../../store/slices/tasksSlice';
import TaskLabelsManager from './TaskLabelsManager';
import { toast } from 'react-hot-toast';
import type { Task, Comment } from '../../types';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, taskId }) => {
  const dispatch = useAppDispatch();
  const { currentTask, taskComments, projectLabels, isLoading, isCommentsLoading } = useAppSelector((state) => state.tasks);
  const { projects } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'DONE',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate: '',
    assigneeId: '',
  });
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Use a single state to track initialization and prevent infinite loops
  const [initState, setInitState] = useState<{
    isInitialized: boolean;
    taskId: string | null;
    projectId: string | null;
  }>({
    isInitialized: false,
    taskId: null,
    projectId: null,
  });

  // Effect 1: Initialize when modal opens with a new task
  useEffect(() => {
    if (isOpen && taskId && initState.taskId !== taskId) {
      // Temporarily disabled to fix infinite loop
      // dispatch(fetchTask(taskId));
      // dispatch(fetchTaskComments(taskId));
      setInitState({
        isInitialized: true,
        taskId: taskId,
        projectId: null,
      });
    }
  }, [dispatch, isOpen, taskId, initState.taskId]);

  // Effect 2: Reset when modal closes
  useEffect(() => {
    if (!isOpen && initState.isInitialized) {
      dispatch(setCurrentTask(null));
      setInitState({
        isInitialized: false,
        taskId: null,
        projectId: null,
      });
    }
  }, [dispatch, isOpen, initState.isInitialized]);

  // Effect 3: Update form and fetch labels when task data is available
  useEffect(() => {
    if (currentTask && initState.isInitialized && initState.taskId === currentTask.id) {
      setEditForm({
        title: currentTask.title,
        description: currentTask.description || '',
        status: currentTask.status,
        priority: currentTask.priority,
        dueDate: currentTask.dueDate ? currentTask.dueDate.split('T')[0] : '',
        assigneeId: currentTask.assigneeId || '',
      });

      // Temporarily disabled project labels fetching to fix infinite loop
      // if (currentTask.projectId && initState.projectId !== currentTask.projectId) {
      //   dispatch(fetchProjectLabels(currentTask.projectId));
      //   setInitState(prev => ({
      //     ...prev,
      //     projectId: currentTask.projectId,
      //   }));
      // }
    }
  }, [currentTask, initState, dispatch]);

  const handleSave = async () => {
    if (!currentTask) return;
    
    try {
      await dispatch(updateTask({
        taskId: currentTask.id,
        taskData: {
          ...editForm,
          dueDate: editForm.dueDate || undefined,
          assigneeId: editForm.assigneeId || undefined,
        }
      })).unwrap();
      
      setIsEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!currentTask) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await dispatch(deleteTask(currentTask.id)).unwrap();
        toast.success('Task deleted successfully');
        onClose();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentTask) return;
    
    setIsSubmittingComment(true);
    try {
      await dispatch(createTaskComment({
        content: newComment.trim(),
        taskId: currentTask.id,
      })).unwrap();
      
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentTask) return;
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await dispatch(deleteTaskComment({
          taskId: currentTask.id,
          commentId,
        })).unwrap();
        toast.success('Comment deleted');
      } catch (error) {
        toast.error('Failed to delete comment');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
            {currentTask && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTask.status)}`}>
                {currentTask.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {currentTask && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : currentTask ? (
              <div className="space-y-6">
                {/* Task Title and Description */}
                <div>
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full text-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 rounded p-2"
                        placeholder="Task title"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Task description"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{currentTask.title}</h3>
                      {currentTask.description && (
                        <p className="text-gray-600 whitespace-pre-wrap">{currentTask.description}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Task Properties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center space-x-3">
                      <Flag className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      {isEditing ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                          className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTask.status)}`}>
                          {currentTask.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="flex items-center space-x-3">
                      <Flag className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Priority:</span>
                      {isEditing ? (
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                          className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(currentTask.priority)}`}>
                          {currentTask.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Assignee */}
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Assignee:</span>
                      {isEditing ? (
                        <select
                          value={editForm.assigneeId}
                          onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                          className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {(() => {
                            const project = Array.isArray(projects) ? projects.find(p => p.id === currentTask.projectId) : null;
                            return project && 'members' in project ? project.members?.map((member: any) => (
                              <option key={member.user.id} value={member.user.id}>
                                {member.user.firstName} {member.user.lastName} ({member.role})
                              </option>
                            )) || [] : [];
                          })()}
                        </select>
                      ) : currentTask.assignee ? (
                        <span className="text-sm text-gray-900">
                          {currentTask.assignee.firstName} {currentTask.assignee.lastName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Due Date:</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                          className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      ) : currentTask.dueDate ? (
                        <span className="text-sm text-gray-900">
                          {formatDate(currentTask.dueDate)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Not set</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save/Cancel buttons when editing */}
                {isEditing && (
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Labels */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <Tag className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Labels:</span>
                  </div>
                  {/* Temporarily disabled to fix infinite loop */}
                  {/* <TaskLabelsManager
                    task={currentTask}
                    onTaskUpdate={(updatedTask) => {
                      // Update the current task in the store
                      dispatch(updateTask({
                        taskId: updatedTask.id,
                        taskData: {}
                      }));
                    }}
                  /> */}
                  <div className="text-sm text-gray-500">
                    Labels management temporarily disabled
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">Task not found</div>
            )}
          </div>

          {/* Comments Sidebar */}
          <div className="w-80 border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">
                  Comments ({taskComments.length})
                </h3>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isCommentsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : taskComments.length > 0 ? (
                taskComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {comment.user.firstName[0]}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                      </div>
                      {comment.user.id === user?.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  No comments yet
                </div>
              )}
            </div>

            {/* Add Comment */}
            <div className="p-4 border-t border-gray-200">
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Comment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
