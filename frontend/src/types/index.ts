export * from './auth';

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  projects?: Project[];
  _count?: {
    members: number;
    projects: number;
  };
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  createdById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  team?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members?: ProjectMember[];
  tasks?: Task[];
  taskLabels?: TaskLabel[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  project?: {
    id: string;
    name: string;
  };
  labels?: TaskLabel[];
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface Notification {
  id: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'COMMENT_ADDED' | 'PROJECT_ASSIGNED' | 'TEAM_INVITE';
  title: string;
  message: string;
  userId: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    totalCount: number;
    hasMore: boolean;
  };
}
