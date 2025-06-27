import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings, MoreHorizontal, Loader2, UserPlus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTeams } from '../../store/slices/teamsSlice';
import CreateTeamModal from '../../components/Teams/CreateTeamModal';
import AddMemberModal from '../../components/Teams/AddMemberModal';
import { canCreateTeam, canManageTeam } from '../../utils/permissions';

const TeamsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { teams, isLoading, error } = useAppSelector((state) => state.teams);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState<{
    isOpen: boolean;
    teamId: string;
    teamName: string;
  }>({
    isOpen: false,
    teamId: '',
    teamName: '',
  });

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  // Ensure teams is always an array
  const safeTeams = Array.isArray(teams) ? teams : [];

  // Check permissions
  const userCanCreateTeam = canCreateTeam(safeTeams);

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
            onClick={() => dispatch(fetchTeams())}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-2">
            Manage your teams and collaborate with team members.
          </p>
        </div>
        {userCanCreateTeam && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Team</span>
          </button>
        )}
        {!userCanCreateTeam && (
          <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
            Only ADMINs and MANAGERs can create teams
          </div>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeTeams.map((team) => (
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
                  <p className="text-lg font-semibold text-gray-900">{team._count?.members || 0}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{team._count?.projects || 0}</p>
                  <p className="text-xs text-gray-500">Projects</p>
                </div>
              </div>
            </div>

            {/* Team Actions */}
            <div className="flex items-center space-x-2">
              <button className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                View Team
              </button>
              {canManageTeam(safeTeams, team.id) && (
                <button
                  onClick={() => setAddMemberModal({
                    isOpen: true,
                    teamId: team.id,
                    teamName: team.name,
                  })}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Add Member"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}

        {/* Create Team Card */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-white border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Team</h3>
          <p className="text-sm text-gray-600 mb-4">
            Start collaborating with a new team
          </p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
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

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={addMemberModal.isOpen}
        onClose={() => setAddMemberModal({ isOpen: false, teamId: '', teamName: '' })}
        teamId={addMemberModal.teamId}
        teamName={addMemberModal.teamName}
      />
    </div>
  );
};

export default TeamsPage;
