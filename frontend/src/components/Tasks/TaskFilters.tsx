import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Flag, FolderOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, clearFilters } from '../../store/slices/tasksSlice';
import { fetchProjects } from '../../store/slices/projectsSlice';
import type { TaskFilters as TaskFiltersType } from '../../services/tasksService';

interface TaskFiltersProps {
  onFiltersChange?: (filters: TaskFiltersType) => void;
  className?: string;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ onFiltersChange, className = '' }) => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.tasks);
  const { projects } = useAppSelector((state) => state.projects);
  const { teams } = useAppSelector((state) => state.teams);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<TaskFiltersType>({
    search: '',
    status: undefined,
    priority: undefined,
    assigneeId: undefined,
    projectId: undefined,
    dueDate: undefined,
  });

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof TaskFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    dispatch(setFilters(newFilters));
    onFiltersChange?.(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: undefined,
      priority: undefined,
      assigneeId: undefined,
      projectId: undefined,
      dueDate: undefined,
    };
    setLocalFilters(clearedFilters);
    dispatch(clearFilters());
    onFiltersChange?.(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Get all team members for assignee filter
  const allMembers = teams.flatMap(team => 
    team.members?.map(member => ({
      id: member.user.id,
      name: `${member.user.firstName} ${member.user.lastName}`,
      email: member.user.email,
    })) || []
  );

  // Remove duplicates
  const uniqueMembers = allMembers.filter((member, index, self) => 
    index === self.findIndex(m => m.id === member.id)
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="inline h-4 w-4 mr-1" />
                Status
              </label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="inline h-4 w-4 mr-1" />
                Priority
              </label>
              <select
                value={localFilters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FolderOpen className="inline h-4 w-4 mr-1" />
                Project
              </label>
              <select
                value={localFilters.projectId || ''}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Assignee
              </label>
              <select
                value={localFilters.assigneeId || ''}
                onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Assignees</option>
                {uniqueMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due Before
              </label>
              <input
                type="date"
                value={localFilters.dueDate || ''}
                onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleClearFilters}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
