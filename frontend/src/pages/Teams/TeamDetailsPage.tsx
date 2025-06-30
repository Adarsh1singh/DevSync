import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, FolderOpen, Settings, UserPlus, MoreVertical, 
  Edit, Trash2, Crown, Shield, User, Calendar, MessageCircle,
  CheckCircle, Clock, AlertCircle, TrendingUp, Activity
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTeams } from '../../store/slices/teamsSlice';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { fetchTasks } from '../../store/slices/tasksSlice';
import { teamsService } from '../../services/teamsService';
import { canManageTeam } from '../../utils/permissions';
import EditTeamModal from '../../components/Teams/EditTeamModal';
import DeleteTeamModal from '../../components/Teams/DeleteTeamModal';
import AddMemberModal from '../../components/Teams/AddMemberModal';
import RemoveMemberModal from '../../components/Teams/RemoveMemberModal';
import type { Team, TeamMember } from '../../types';

const TeamDetailsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { teams, isLoading: teamsLoading } = useAppSelector((state) => state.teams);
  const { projects } = useAppSelector((state) => state.projects);
  const { tasks } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState({
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

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'activity'>('overview');
  const [activeMemberDropdown, setActiveMemberDropdown] = useState<string | null>(null);
  const [teamActivity, setTeamActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

   // Find the current team
  const team = Array.isArray(teams) ? teams.find(t => t.id === teamId) : null;

  useEffect(() => {
    dispatch(fetchTeams());
    dispatch(fetchProjects());
    dispatch(fetchTasks());
  }, [dispatch]);

  // Fetch team activity when team changes
  useEffect(() => {
    const fetchTeamActivity = async () => {
      if (team?.id) {
        setActivityLoading(true);
        try {
          const activities = await teamsService.getTeamActivity(team.id);
          setTeamActivity(activities);
        } catch (error) {
          console.error('Failed to fetch team activity:', error);
          setTeamActivity([]);
        } finally {
          setActivityLoading(false);
        }
      }
    };

    fetchTeamActivity();
  }, [team?.id]);
  
  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Team not found</h2>
        <p className="text-gray-600 mb-4">The team you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/teams')}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  // Get team data
  const safeProjects = Array.isArray(projects) ? projects.filter(p => p.teamId === team.id) : [];
  const safeTasks = Array.isArray(tasks) ? tasks.filter(t => 
    safeProjects.some(p => p.id === t.projectId)
  ) : [];
  
  const userRole = team.members?.find(member => member.userId === user?.id)?.role;
  const canManage = canManageTeam(teams, team.id);
  const isAdmin = userRole === 'ADMIN';

  // Calculate team statistics
  const teamStats = {
    totalMembers: team.members?.length || 0,
    totalProjects: safeProjects.length,
    activeProjects: safeProjects.filter(p => p.isActive).length,
    totalTasks: safeTasks.length,
    completedTasks: safeTasks.filter(t => t.status === 'DONE').length,
    inProgressTasks: safeTasks.filter(t => t.status === 'IN_PROGRESS').length,
    todoTasks: safeTasks.filter(t => t.status === 'TODO').length,
  };

  // Helper function to get activity icon and color
  const getActivityIconAndColor = (type: string) => {
    switch (type) {
      case 'task_completed':
        return { icon: CheckCircle, color: 'text-green-600' };
      case 'project_created':
        return { icon: FolderOpen, color: 'text-blue-600' };
      case 'member_joined':
        return { icon: UserPlus, color: 'text-purple-600' };
      default:
        return { icon: Activity, color: 'text-gray-600' };
    }
  };

  const handleEditTeam = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteTeam = () => {
    setIsDeleteModalOpen(true);
  };

  const handleAddMember = () => {
    setAddMemberModal({
      isOpen: true,
      teamId: team.id,
      teamName: team.name,
    });
  };

  const handleRemoveMember = (member: TeamMember) => {
    setRemoveMemberModal({
      isOpen: true,
      member,
      teamName: team.name,
    });
    setActiveMemberDropdown(null);
  };

  const closeModals = async () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setAddMemberModal({ isOpen: false, teamId: '', teamName: '' });
    setRemoveMemberModal({ isOpen: false, member: null, teamName: '' });
    dispatch(fetchTeams());

    // Refresh team activity
    if (team?.id) {
      try {
        const activities = await teamsService.getTeamActivity(team.id);
        setTeamActivity(activities);
      } catch (error) {
        console.error('Failed to refresh team activity:', error);
      }
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-red-600" />;
      case 'MANAGER':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'DEVELOPER':
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700';
      case 'DEVELOPER':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/teams')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600">{team.description || 'No description provided'}</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddMember}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
            <button
              onClick={handleEditTeam}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Team</span>
            </button>
            <button
              onClick={handleDeleteTeam}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.activeProjects}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{teamStats.totalProjects} total</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.totalTasks}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{teamStats.completedTasks} completed</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamStats.totalTasks > 0 ? Math.round((teamStats.completedTasks / teamStats.totalTasks) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'projects', label: 'Projects', icon: FolderOpen },
            { id: 'activity', label: 'Activity', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Status Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">To Do</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{teamStats.todoTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">In Progress</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{teamStats.inProgressTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Completed</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{teamStats.completedTasks}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activityLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : teamActivity.length > 0 ? (
                    teamActivity.slice(0, 5).map((activity) => {
                      const { icon: ActivityIcon, color } = getActivityIconAndColor(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <ActivityIcon className={`h-4 w-4 mt-0.5 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Members ({teamStats.totalMembers})</h3>
              {isAdmin && (
                <button
                  onClick={handleAddMember}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.members?.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {member.user.firstName} {member.user.lastName}
                        </h4>
                        <p className="text-xs text-gray-500">{member.user.email}</p>
                      </div>
                    </div>

                    {isAdmin && member.userId !== user?.id && (
                      <div className="relative">
                        <button
                          onClick={() => setActiveMemberDropdown(activeMemberDropdown === member.id ? null : member.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>

                        {activeMemberDropdown === member.id && (
                          <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Joined {formatTimeAgo(member.joinedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Projects ({teamStats.totalProjects})</h3>
            </div>

            {safeProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeProjects.map((project) => {
                  const projectTasks = safeTasks.filter(t => t.projectId === project.id);
                  const completedTasks = projectTasks.filter(t => t.status === 'DONE').length;
                  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

                  return (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {project.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium text-gray-900">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{projectTasks.length} tasks</span>
                          <span>{completedTasks} completed</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No projects yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Activity</h3>

            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : teamActivity.length > 0 ? (
              <div className="space-y-4">
                {teamActivity.map((activity) => {
                  const { icon: ActivityIcon, color } = getActivityIconAndColor(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full bg-white ${color}`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">by {activity.user}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No activity yet</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <EditTeamModal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        team={team}
      />

      <DeleteTeamModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        team={team}
      />

      <AddMemberModal
        isOpen={addMemberModal.isOpen}
        onClose={closeModals}
        teamId={addMemberModal.teamId}
        teamName={addMemberModal.teamName}
      />

      {removeMemberModal.member && (
        <RemoveMemberModal
          isOpen={removeMemberModal.isOpen}
          onClose={closeModals}
          member={removeMemberModal.member}
          teamName={removeMemberModal.teamName}
        />
      )}
    </div>
  );
};

export default TeamDetailsPage;
