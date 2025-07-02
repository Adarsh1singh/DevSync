import React from 'react';
import { Calendar, User, MessageCircle, Tag, Clock, AlertCircle } from 'lucide-react';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onClick, 
  isDragging = false, 
  className = '' 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertCircle className="h-3 w-3" />;
      case 'HIGH': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-600' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: 'text-blue-600' };
    } else {
      return { 
        text: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }), 
        color: 'text-gray-600' 
      };
    }
  };

  const dueDateInfo = task.dueDate ? formatDate(task.dueDate) : null;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${onClick ? 'hover:border-blue-300' : ''}
        ${className}
      `}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1 pr-2">
          {task.title}
        </h3>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {getPriorityIcon(task.priority)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Task Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: label.color + '20', 
                color: label.color,
                border: `1px solid ${label.color}40`
              }}
            >
              <Tag className="h-2 w-2 mr-1" />
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{task.labels.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-20">
                {task.assignee.firstName} {task.assignee.lastName}
              </span>
            </div>
          )}

          {/* Comments count */}
          {task._count?.comments && task._count.comments > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3" />
              <span>{task._count.comments}</span>
            </div>
          )}
        </div>

        {/* Due Date */}
        {dueDateInfo && (
          <div className={`flex items-center space-x-1 ${dueDateInfo.color}`}>
            <Calendar className="h-3 w-3" />
            <span className="font-medium">{dueDateInfo.text}</span>
          </div>
        )}
      </div>

      {/* Progress indicator for overdue tasks */}
      {dueDateInfo?.color === 'text-red-600' && (
        <div className="mt-2 w-full bg-red-100 rounded-full h-1">
          <div className="bg-red-500 h-1 rounded-full w-full"></div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
