import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, Palette } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchProjectLabels, 
  createTaskLabel,
} from '../../store/slices/tasksSlice';
import { tasksService } from '../../services/tasksService';
import { toast } from 'react-hot-toast';
import type { Task, TaskLabel } from '../../types';

interface TaskLabelsManagerProps {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => void;
}

const TaskLabelsManager: React.FC<TaskLabelsManagerProps> = ({ task, onTaskUpdate }) => {
  const dispatch = useAppDispatch();
  const { projectLabels, isLabelsLoading } = useAppSelector((state) => state.tasks);
  
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelForm, setNewLabelForm] = useState({
    name: '',
    color: '#3B82F6',
  });

  const predefinedColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  useEffect(() => {
    if (task.projectId) {
      dispatch(fetchProjectLabels(task.projectId));
    }
  }, [dispatch, task.projectId]);

  const handleCreateLabel = async () => {
    if (!newLabelForm.name.trim()) {
      toast.error('Label name is required');
      return;
    }

    try {
      await dispatch(createTaskLabel({
        name: newLabelForm.name.trim(),
        color: newLabelForm.color,
        projectId: task.projectId,
      })).unwrap();

      setNewLabelForm({ name: '', color: '#3B82F6' });
      setIsCreatingLabel(false);
      toast.success('Label created successfully');
    } catch (error) {
      toast.error('Failed to create label');
    }
  };

  const handleAssignLabel = async (labelId: string) => {
    try {
      await tasksService.assignLabelToTask(task.id, labelId);
      
      // Update the task with the new label
      const label = projectLabels.find(l => l.id === labelId);
      if (label) {
        const updatedTask = {
          ...task,
          labels: [...(task.labels || []), label],
        };
        onTaskUpdate(updatedTask);
        toast.success('Label assigned to task');
      }
    } catch (error) {
      toast.error('Failed to assign label');
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await tasksService.removeLabelFromTask(task.id, labelId);
      
      // Update the task by removing the label
      const updatedTask = {
        ...task,
        labels: (task.labels || []).filter(l => l.id !== labelId),
      };
      onTaskUpdate(updatedTask);
      toast.success('Label removed from task');
    } catch (error) {
      toast.error('Failed to remove label');
    }
  };

  const assignedLabelIds = new Set((task.labels || []).map(l => l.id));
  const availableLabels = projectLabels.filter(label => !assignedLabelIds.has(label.id));

  return (
    <div className="space-y-4">
      {/* Assigned Labels */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Labels</h4>
        {task.labels && task.labels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {task.labels.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium group cursor-pointer"
                style={{ 
                  backgroundColor: label.color + '20', 
                  color: label.color,
                  border: `1px solid ${label.color}40`
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {label.name}
                <button
                  onClick={() => handleRemoveLabel(label.id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 hover:text-red-600" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No labels assigned</p>
        )}
      </div>

      {/* Available Labels */}
      {availableLabels.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Available Labels</h4>
          <div className="flex flex-wrap gap-2">
            {availableLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => handleAssignLabel(label.id)}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ 
                  backgroundColor: label.color + '20', 
                  color: label.color,
                  border: `1px solid ${label.color}40`
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {label.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create New Label */}
      <div>
        {!isCreatingLabel ? (
          <button
            onClick={() => setIsCreatingLabel(true)}
            className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create new label</span>
          </button>
        ) : (
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Label Name
              </label>
              <input
                type="text"
                value={newLabelForm.name}
                onChange={(e) => setNewLabelForm({ ...newLabelForm, name: e.target.value })}
                placeholder="Enter label name"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex flex-wrap gap-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelForm({ ...newLabelForm, color })}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newLabelForm.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-1">
                  <Palette className="h-4 w-4 text-gray-400" />
                  <input
                    type="color"
                    value={newLabelForm.color}
                    onChange={(e) => setNewLabelForm({ ...newLabelForm, color: e.target.value })}
                    className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateLabel}
                disabled={!newLabelForm.name.trim()}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingLabel(false);
                  setNewLabelForm({ name: '', color: '#3B82F6' });
                }}
                className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Preview */}
            {newLabelForm.name && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 block mb-1">Preview:</span>
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: newLabelForm.color + '20', 
                    color: newLabelForm.color,
                    border: `1px solid ${newLabelForm.color}40`
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {newLabelForm.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isLabelsLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default TaskLabelsManager;
