import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Calendar, Users, MoreHorizontal, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { fetchTeams } from '../../store/slices/teamsSlice';
import CreateProjectModal from '../../components/Projects/CreateProjectModal';
import { canCreateAnyProject } from '../../utils/permissions';

const ProjectsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, isLoading, error } = useAppSelector((state) => state.projects);
  const { teams } = useAppSelector((state) => state.teams);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTeams());
  }, [dispatch]);

  // Ensure data is always arrays
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTeams = Array.isArray(teams) ? teams : [];

  // Check permissions
  const userCanCreateProject = canCreateAnyProject(safeTeams);

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

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button className="px-4 py-2 text-sm font-medium bg-background text-foreground rounded-md shadow-sm">
          All Projects
        </button>
        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Active
        </button>
        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Completed
        </button>
        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          On Hold
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {safeProjects.map((project) => {
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
                <button className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  View Project
                </button>
                <button className="px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                  Tasks
                </button>
              </div>
            </div>
          );
        })}

        {/* Create Project Card */}
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
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold text-foreground mt-2">{projects.length}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {projects.filter(p => p.status === 'completed').length}
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
