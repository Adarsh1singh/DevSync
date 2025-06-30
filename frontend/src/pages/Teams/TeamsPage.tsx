import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, MoreVertical, Loader2, UserPlus, Edit, Trash2, Crown, Shield, User, AlertCircle, CheckCircle} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTeams} from '../../store/slices/teamsSlice';
import { teamsService } from '../../services/teamsService';
import CreateTeamModal from '../../components/Teams/CreateTeamModal';
import AddMemberModal from '../../components/Teams/AddMemberModal';
import { canCreateTeam, canManageTeam } from '../../utils/permissions';
import type { Team, TeamMember } from '../../types';
import EditTeamModal from '../../components/Teams/EditTeamModal';
import DeleteTeamModal from '../../components/Teams/DeleteTeamModal';
import RemoveMemberModal from '../../components/Teams/RemoveMemberModal';

const TeamsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { teams, isLoading, error } = useAppSelector((state) => state.teams);
  const { user } = useAppSelector((state) => state.auth);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Global activity state
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState<{
    isOpen: boolean;
    teamId: string;
    teamName: string;
  }>({
    isOpen: false,
    teamId: '',
    teamName: '',
  });
  const [removeMemberModal, setRemoveMemberModal] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
    teamName: string;
  }>({
    isOpen: false,
    member: null,
    teamName: '',
  });

  // Selected items
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTeams());
    fetchGlobalActivity();
  }, [dispatch]);

  const fetchGlobalActivity = async () => {
    setActivityLoading(true);
    try {
      const activities = await teamsService.getGlobalTeamActivity();
      setGlobalActivity(activities);
    } catch (error) {
      console.error('Failed to fetch global team activity:', error);
      setGlobalActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  // Ensure teams is always an array
  const safeTeams = Array.isArray(teams) ? teams : [];

  // Check permissions
  const userCanCreateTeam = canCreateTeam(safeTeams);

  // Handler functions
  const handleCreateTeam = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleAddMember = (teamId: string, teamName: string) => {
    setAddMemberModal({
      isOpen: true,
      teamId,
      teamName,
    });
    setActiveDropdown(null);
  };



  const closeAddMemberModal = () => {
    setAddMemberModal({
      isOpen: false,
      teamId: '',
      teamName: '',
    });
    dispatch(fetchTeams());
    fetchGlobalActivity(); // Refresh activity
  };

  const closeRemoveMemberModal = () => {
    setRemoveMemberModal({
      isOpen: false,
      member: null,
      teamName: '',
    });
    dispatch(fetchTeams());
    fetchGlobalActivity(); // Refresh activity
  };

  // Helper function to get activity icon and color
  const getActivityIconAndColor = (type: string) => {
    switch (type) {
      case 'task_completed':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'member_joined':
        return { icon: UserPlus, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'team_created':
        return { icon: Plus, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      default:
        return { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTeam(null);
    dispatch(fetchTeams());
    fetchGlobalActivity(); // Refresh activity
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTeam(null);
    dispatch(fetchTeams());
    fetchGlobalActivity(); // Refresh activity
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
            onClick={handleCreateTeam}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Team</span>
          </button>
        )}
        {!userCanCreateTeam && (
          <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Only ADMINs and MANAGERs can create teams</span>
          </div>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeTeams.map((team) => {
          const userRole = team.members?.find(member => member.userId === user?.id)?.role;
          const isAdmin = userRole === 'ADMIN';
          const canManage = canManageTeam(safeTeams, team.id);

          return (
            <div key={team.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Team Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === team.id ? null : team.id);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>

                  {activeDropdown === team.id && (
                    <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit Team</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Team</span>
                          </button>
                          <hr className="my-1" />
                        </>
                      )}
                      <button
                        onClick={() => handleAddMember(team.id, team.name)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        disabled={!canManage}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {team.description || 'No description provided'}
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

                {/* Role Badge */}
                <div className="flex items-center space-x-1">
                  {userRole === 'ADMIN' && (
                    <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                      <Crown className="h-3 w-3" />
                      <span>Admin</span>
                    </div>
                  )}
                  {userRole === 'MANAGER' && (
                    <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      <Shield className="h-3 w-3" />
                      <span>Manager</span>
                    </div>
                  )}
                  {userRole === 'DEVELOPER' && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                      <User className="h-3 w-3" />
                      <span>Developer</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Members Preview */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Members</span>
                  <span className="text-xs text-gray-500">{team.members?.length || 0} total</span>
                </div>
                <div className="flex -space-x-2">
                  {team.members?.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="relative group"
                      title={`${member.user.firstName} ${member.user.lastName} (${member.role})`}
                    >
                      <div className="h-8 w-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </div>
                    </div>
                  ))}
                  {(team.members?.length || 0) > 5 && (
                    <div className="h-8 w-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">
                      +{(team.members?.length || 0) - 5}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  View Details
                </button>
                {canManage && (
                  <button
                    onClick={() => handleAddMember(team.id, team.name)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    title="Add Member"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Team Activity</h2>
        <div className="space-y-4">
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : globalActivity.length > 0 ? (
            globalActivity.map((activity) => {
              const { icon: ActivityIcon, color, bgColor } = getActivityIconAndColor(activity.type);
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`h-8 w-8 ${bgColor} rounded-full flex items-center justify-center`}>
                    <ActivityIcon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Activity will appear here when team members are active</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          dispatch(fetchTeams());
          fetchGlobalActivity();
        }}
      />

      {/* Edit Team Modal */}
      {selectedTeam && (
        <EditTeamModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          team={selectedTeam}
        />
      )}

      {/* Delete Team Modal */}
      {selectedTeam && (
        <DeleteTeamModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          team={selectedTeam}
        />
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={addMemberModal.isOpen}
        onClose={closeAddMemberModal}
        teamId={addMemberModal.teamId}
        teamName={addMemberModal.teamName}
      />

      {/* Remove Member Modal */}
      {removeMemberModal.member && (
        <RemoveMemberModal
          isOpen={removeMemberModal.isOpen}
          onClose={closeRemoveMemberModal}
          member={removeMemberModal.member}
          teamName={removeMemberModal.teamName}
        />
      )}
    </div>
  );
};

export default TeamsPage;
