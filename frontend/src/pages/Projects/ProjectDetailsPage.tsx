import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Users, FolderOpen, Plus, MoreVertical, Edit, Trash2, UserPlus, CheckCircle, Clock,
  TrendingUp, Activity, Search, MessageCircle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProject } from '../../store/slices/projectsSlice';
import { fetchTasks } from '../../store/slices/tasksSlice';
import { projectsService } from '../../services/projectsService';
import { canManageProject } from '../../utils/permissions';
import EditProjectModal from '../../components/Projects/EditProjectModal';
import DeleteProjectModal from '../../components/Projects/DeleteProjectModal';
import AddProjectMemberModal from '../../components/Projects/AddProjectMemberModal';
import CreateTaskModal from '../../components/Projects/CreateTaskModal';
import EditTaskModal from '../../components/Projects/EditTaskModal';
import RemoveProjectMemberModal from '../../components/Projects/RemoveProjectMemberModal';
import type { Task, ProjectMember } from '../../types';

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  
  const { currentProject, isLoading: projectLoading } = useAppSelector((state) => state.projects);
  const { tasks } = useAppSelector((state) => state.tasks);

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'activity'>('overview');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectActivity, setProjectActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeMemberDropdown, setActiveMemberDropdown] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editTaskModal, setEditTaskModal] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({
    isOpen: false,
    task: null,
  });
  const [removeMemberModal, setRemoveMemberModal] = useState<{
    isOpen: boolean;
    member: ProjectMember | null;
  }>({
    isOpen: false,
    member: null,
  });

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProject(projectId));
      dispatch(fetchTasks());
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'tasks', 'members', 'activity'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Fetch project activity when project changes or activity tab is selected
  useEffect(() => {
    const fetchProjectActivity = async () => {
      if (currentProject?.id && activeTab === 'activity') {
        setActivityLoading(true);
        try {
          const activities = await projectsService.getProjectActivity(currentProject.id);
          setProjectActivity(activities);
        } catch (error) {
          console.error('Failed to fetch project activity:', error);
          setProjectActivity([]);
        } finally {
          setActivityLoading(false);
        }
      }
    };

    fetchProjectActivity();
  }, [currentProject?.id, activeTab]);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/projects')}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  // Get project data
  const projectTasks = Array.isArray(tasks) ? tasks.filter(t => t.projectId === currentProject.id) : [];
  const canManage = canManageProject(currentProject);

  // Calculate project statistics
  const projectStats = {
    totalTasks: projectTasks.length,
    todoTasks: projectTasks.filter(t => t.status === 'TODO').length,
    inProgressTasks: projectTasks.filter(t => t.status === 'IN_PROGRESS').length,
    doneTasks: projectTasks.filter(t => t.status === 'DONE').length,
    totalMembers: currentProject.members?.length || 0,
    completionRate: projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === 'DONE').length / projectTasks.length) * 100) : 0,
  };

  // Filter tasks based on current filter and search
  const filteredTasks = projectTasks.filter(task => {
    let matchesFilter = false;
    if (taskFilter === 'all') {
      matchesFilter = true;
    } else if (taskFilter === 'todo') {
      matchesFilter = task.status === 'TODO';
    } else if (taskFilter === 'in_progress') {
      matchesFilter = task.status === 'IN_PROGRESS';
    } else if (taskFilter === 'done') {
      matchesFilter = task.status === 'DONE';
    }

    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Helper function to get activity icon and color
  const getActivityIconAndColor = (type: string) => {
    switch (type) {
      case 'task_completed':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'task_created':
        return { icon: Plus, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'task_assigned':
        return { icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'member_added':
        return { icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-100' };
      case 'comment_added':
        return { icon: MessageCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      default:
        return { icon: Activity, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-gray-600">{currentProject.description || 'No description provided'}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentProject.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {currentProject.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        {canManage && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{projectStats.totalTasks}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{projectStats.inProgressTasks}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{projectStats.doneTasks}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{projectStats.completionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'members', label: 'Members', icon: Users },
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
              {/* Project Progress */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-bold text-gray-900">{projectStats.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${projectStats.completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{projectStats.todoTasks}</div>
                      <div className="text-sm text-yellow-700">To Do</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{projectStats.inProgressTasks}</div>
                      <div className="text-sm text-blue-700">In Progress</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{projectStats.doneTasks}</div>
                      <div className="text-sm text-green-700">Completed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Team</span>
                    <span className="text-sm text-gray-900">{currentProject.team?.name || 'No Team'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">{formatDate(currentProject.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentProject.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {currentProject.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Members</span>
                    <span className="text-sm text-gray-900">{projectStats.totalMembers}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-600">Tasks</span>
                    <span className="text-sm text-gray-900">{projectStats.totalTasks}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-6">
            {/* Task Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Tasks ({filteredTasks.length})</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Tasks</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {canManage && (
                  <button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tasks List */}
            {filteredTasks.length > 0 ? (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.priority && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {task.assignee && (
                            <span>Assigned to: {task.assignee.firstName} {task.assignee.lastName}</span>
                          )}
                          {task.dueDate && (
                            <span>Due: {formatDate(task.dueDate)}</span>
                          )}
                          <span>Created: {formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => setEditTaskModal({ isOpen: true, task })}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tasks found</p>
                {canManage && (
                  <button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create First Task
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Project Members ({projectStats.totalMembers})</h3>
              {canManage && (
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {currentProject.members && currentProject.members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentProject.members.map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {member.user.firstName} {member.user.lastName}
                        </h4>
                        <p className="text-xs text-gray-500">{member.user.email}</p>
                        {member.role && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {member.role}
                          </span>
                        )}
                      </div>
                      {canManage && (
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
                                onClick={() => {
                                  setRemoveMemberModal({ isOpen: true, member });
                                  setActiveMemberDropdown(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No members yet</p>
                {canManage && (
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add First Member
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Activity</h3>

            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : projectActivity.length > 0 ? (
              <div className="space-y-4">
                {projectActivity.map((activity) => {
                  const { icon: ActivityIcon, color, bgColor } = getActivityIconAndColor(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${bgColor}`}>
                        <ActivityIcon className={`h-4 w-4 ${color}`} />
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
                <p className="text-xs text-gray-400 mt-1">Activity will appear here when team members work on the project</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          dispatch(fetchProject(projectId!));
        }}
        project={currentProject}
      />

      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          navigate('/projects');
        }}
        project={currentProject}
      />

      <AddProjectMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => {
          setIsAddMemberModalOpen(false);
          dispatch(fetchProject(projectId!));
        }}
        projectId={currentProject.id}
        projectName={currentProject.name}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          dispatch(fetchTasks());
        }}
        project={currentProject}
      />

      {editTaskModal.task && (
        <EditTaskModal
          isOpen={editTaskModal.isOpen}
          onClose={() => {
            setEditTaskModal({ isOpen: false, task: null });
            dispatch(fetchTasks());
          }}
          task={editTaskModal.task}
          project={currentProject}
        />
      )}

      {removeMemberModal.member && (
        <RemoveProjectMemberModal
          isOpen={removeMemberModal.isOpen}
          onClose={() => {
            setRemoveMemberModal({ isOpen: false, member: null });
            dispatch(fetchProject(projectId!));
          }}
          member={removeMemberModal.member}
          projectName={currentProject.name}
        />
      )}
    </div>
  );
};

export default ProjectDetailsPage;
