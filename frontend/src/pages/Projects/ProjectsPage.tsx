import React from 'react';
import { Plus, FolderOpen, Calendar, Users, MoreHorizontal } from 'lucide-react';

const ProjectsPage: React.FC = () => {
  // Mock data - will be replaced with real data from Redux store
  const projects = [
    {
      id: '1',
      name: 'DevSync Platform',
      description: 'Main platform development for team collaboration and task management',
      team: 'Development Team',
      memberCount: 6,
      taskCount: 24,
      completedTasks: 18,
      dueDate: '2024-03-15',
      status: 'active',
    },
    {
      id: '2',
      name: 'Mobile App',
      description: 'React Native mobile application for DevSync',
      team: 'Development Team',
      memberCount: 4,
      taskCount: 12,
      completedTasks: 8,
      dueDate: '2024-04-01',
      status: 'active',
    },
    {
      id: '3',
      name: 'Design System',
      description: 'Comprehensive design system and component library',
      team: 'Design Team',
      memberCount: 3,
      taskCount: 8,
      completedTasks: 8,
      dueDate: '2024-02-28',
      status: 'completed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your projects and track progress across teams.
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
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
        {projects.map((project) => {
          const progressPercentage = getProgressPercentage(project.completedTasks, project.taskCount);
          
          return (
            <div key={project.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.team}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                  <button className="p-1 hover:bg-accent rounded transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Project Description */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {project.completedTasks}/{project.taskCount} tasks
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-muted-foreground">{progressPercentage}% complete</span>
                </div>
              </div>

              {/* Project Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{project.memberCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(project.dueDate).toLocaleDateString()}
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
        <div className="bg-card border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Create New Project</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start a new project and invite your team
          </p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
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
    </div>
  );
};

export default ProjectsPage;
