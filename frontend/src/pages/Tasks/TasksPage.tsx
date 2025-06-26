import React, { useState } from 'react';
import { Plus, Filter, Search, Calendar, User, Flag } from 'lucide-react';

const TasksPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'kanban'>('kanban');

  // Mock data - will be replaced with real data from Redux store
  const tasks = {
    TODO: [
      {
        id: '1',
        title: 'Design user onboarding flow',
        description: 'Create wireframes and mockups for the user onboarding process',
        priority: 'HIGH',
        dueDate: '2024-03-20',
        assignee: { name: 'Jane Smith', avatar: null },
        project: 'DevSync Platform',
        labels: ['Design', 'UX'],
      },
      {
        id: '2',
        title: 'Set up database migrations',
        description: 'Create initial database schema and migration scripts',
        priority: 'MEDIUM',
        dueDate: '2024-03-18',
        assignee: { name: 'Mike Johnson', avatar: null },
        project: 'DevSync Platform',
        labels: ['Backend', 'Database'],
      },
    ],
    IN_PROGRESS: [
      {
        id: '3',
        title: 'Implement user authentication',
        description: 'Build JWT-based authentication system with role management',
        priority: 'HIGH',
        dueDate: '2024-03-15',
        assignee: { name: 'John Doe', avatar: null },
        project: 'DevSync Platform',
        labels: ['Backend', 'Security'],
      },
      {
        id: '4',
        title: 'Create task management UI',
        description: 'Build the kanban board interface for task management',
        priority: 'MEDIUM',
        dueDate: '2024-03-22',
        assignee: { name: 'Sarah Wilson', avatar: null },
        project: 'DevSync Platform',
        labels: ['Frontend', 'React'],
      },
    ],
    DONE: [
      {
        id: '5',
        title: 'Project setup and configuration',
        description: 'Initialize project structure and development environment',
        priority: 'HIGH',
        dueDate: '2024-03-10',
        assignee: { name: 'John Doe', avatar: null },
        project: 'DevSync Platform',
        labels: ['Setup', 'DevOps'],
      },
    ],
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const TaskCard = ({ task }: { task: any }) => (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-foreground text-sm line-clamp-2">{task.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Task Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
              <span>{task.assignee.name}</span>
            </div>
          )}
        </div>
        {task.dueDate && (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your tasks across all projects.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 border border-border px-4 py-2 rounded-lg hover:bg-accent transition-colors">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="pl-10 pr-4 py-2 w-80 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              view === 'kanban'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              view === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">To Do</h2>
              <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                {tasks.TODO.length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks.TODO.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              <button className="w-full border border-dashed border-border rounded-lg p-4 text-muted-foreground hover:bg-accent/50 transition-colors">
                <Plus className="h-4 w-4 mx-auto mb-1" />
                <span className="text-sm">Add a task</span>
              </button>
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-blue-50/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">In Progress</h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {tasks.IN_PROGRESS.length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks.IN_PROGRESS.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              <button className="w-full border border-dashed border-border rounded-lg p-4 text-muted-foreground hover:bg-accent/50 transition-colors">
                <Plus className="h-4 w-4 mx-auto mb-1" />
                <span className="text-sm">Add a task</span>
              </button>
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-green-50/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Done</h2>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                {tasks.DONE.length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks.DONE.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">All Tasks</h2>
          </div>
          <div className="divide-y divide-border">
            {Object.values(tasks).flat().map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-foreground">{task.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{task.project}</span>
                      <span>{task.assignee.name}</span>
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
