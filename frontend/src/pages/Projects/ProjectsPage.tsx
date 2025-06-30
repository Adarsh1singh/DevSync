import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Calendar, Users, MoreHorizontal, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { fetchTeams } from '../../store/slices/teamsSlice';
import CreateProjectModal from '../../components/Projects/CreateProjectModal';
import { canCreateAnyProject } from '../../utils/permissions';

const ProjectsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projects, isLoading, error } = useAppSelector((state) => state.projects);
  const { teams } = useAppSelector((state) => state.teams);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTeams());
  }, [dispatch]);

  // Ensure data is always arrays
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTeams = Array.isArray(teams) ? teams : [];

  // Check permissions
  const userCanCreateProject = canCreateAnyProject(safeTeams);

  // Filter projects based on active filter and search term
  const filteredProjects = safeProjects.filter(project => {
    const matchesFilter = (() => {
      switch (activeFilter) {
        case 'active':
          return project.isActive;
        case 'completed':
          return !project.isActive; // Assuming inactive means completed
        case 'on_hold':
          return false; // We'll need to add a status field for this
        default:
          return true;
      }
    })();

    const matchesSearch = searchTerm === '' ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.team?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate filter counts
  const filterCounts = {
    all: safeProjects.length,
    active: safeProjects.filter(p => p.isActive).length,
    completed: safeProjects.filter(p => !p.isActive).length,
    on_hold: 0, // We'll implement this later
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchProjects())}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage your projects and track progress across teams.
          </p>
        </div>
        {userCanCreateProject && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        )}
        {!userCanCreateProject && (
          <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
            Only ADMINs and MANAGERs can create projects
          </div>
        )}
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All Projects', count: filterCounts.all },
            { id: 'active', label: 'Active', count: filterCounts.active },
            { id: 'completed', label: 'Completed', count: filterCounts.completed },
            { id: 'on_hold', label: 'On Hold', count: filterCounts.on_hold },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === filter.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const taskCount = project._count?.tasks || 0;
          const progressPercentage = getProgressPercentage(0, taskCount); // We'll need to calculate completed tasks
          
          return (
            <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.team?.name || 'No Team'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.isActive)}`}>
                    {project.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Project Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || 'No description provided'}
              </p>

              {/* Project Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{project.members?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{taskCount} tasks</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  View Project
                </button>
                <button
                  onClick={() => navigate(`/projects/${project.id}?tab=tasks`)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Tasks
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredProjects.length === 0 && safeProjects.length > 0 && (
          <div className="col-span-full text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? `No projects match "${searchTerm}"` : `No ${activeFilter} projects found`}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Create Project Card */}
        {userCanCreateProject && (
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Project</h3>
            <p className="text-sm text-gray-600 mb-4">
              Start a new project and invite your team
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{safeProjects.length}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {safeProjects.filter(p => p.isActive).length}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {safeProjects.filter(p => !p.isActive).length}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ProjectsPage;
