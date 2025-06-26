import React from 'react';
import { Plus, Users, Settings, MoreHorizontal } from 'lucide-react';

const TeamsPage: React.FC = () => {
  // Mock data - will be replaced with real data from Redux store
  const teams = [
    {
      id: '1',
      name: 'Development Team',
      description: 'Main development team for DevSync platform',
      memberCount: 8,
      projectCount: 3,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Design Team',
      description: 'UI/UX design team',
      memberCount: 4,
      projectCount: 2,
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      name: 'QA Team',
      description: 'Quality assurance and testing team',
      memberCount: 3,
      projectCount: 1,
      createdAt: '2024-02-01',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground mt-2">
            Manage your teams and collaborate with team members.
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Team Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Team Description */}
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {team.description}
            </p>

            {/* Team Stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{team.memberCount}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{team.projectCount}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
              </div>
            </div>

            {/* Team Actions */}
            <div className="flex items-center space-x-2">
              <button className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                View Team
              </button>
              <button className="p-2 border border-border rounded-lg hover:bg-accent transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}

        {/* Create Team Card */}
        <div className="bg-card border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Create New Team</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start collaborating with a new team
          </p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Get Started
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Team Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-background rounded-lg">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                John Doe joined Development Team
              </p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-background rounded-lg">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Design Team settings updated
              </p>
              <p className="text-xs text-muted-foreground">1 day ago</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-background rounded-lg">
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Plus className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                QA Team was created
              </p>
              <p className="text-xs text-muted-foreground">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
