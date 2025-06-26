import React from 'react';
import { BarChart3, Users, FolderOpen, CheckSquare, Clock, TrendingUp } from 'lucide-react';
import AnalyticsDashboard from '../../components/Dashboard/AnalyticsDashboard';

const DashboardPage: React.FC = () => {
  // Mock data - will be replaced with real data from Redux store
  const stats = [
    {
      title: 'Total Tasks',
      value: '24',
      change: '+12%',
      changeType: 'positive' as const,
      icon: CheckSquare,
    },
    {
      title: 'Active Projects',
      value: '8',
      change: '+3%',
      changeType: 'positive' as const,
      icon: FolderOpen,
    },
    {
      title: 'Team Members',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Avg. Completion Time',
      value: '2.4 days',
      change: '-8%',
      changeType: 'positive' as const,
      icon: Clock,
    },
  ];

  const recentTasks = [
    {
      id: '1',
      title: 'Implement user authentication',
      project: 'DevSync Platform',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignee: 'John Doe',
    },
    {
      id: '2',
      title: 'Design dashboard mockups',
      project: 'DevSync Platform',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: 'Jane Smith',
    },
    {
      id: '3',
      title: 'Set up CI/CD pipeline',
      project: 'DevSync Platform',
      status: 'DONE',
      priority: 'HIGH',
      assignee: 'Mike Johnson',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'URGENT':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500 font-medium">{stat.change}</span>
              <span className="text-sm text-muted-foreground ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Tasks</h2>
            <button className="text-primary hover:text-primary/80 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{task.project}</p>
                  <p className="text-xs text-muted-foreground mt-1">Assigned to {task.assignee}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Create New Task</p>
                  <p className="text-sm text-muted-foreground">Add a task to your project</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">New Project</p>
                  <p className="text-sm text-muted-foreground">Start a new project</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Invite Team Member</p>
                  <p className="text-sm text-muted-foreground">Add someone to your team</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-accent transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Check team performance</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
};

export default DashboardPage;
