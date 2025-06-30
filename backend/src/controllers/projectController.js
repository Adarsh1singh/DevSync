const prisma = require('../config/database');

/**
 * Create a new project
 */
const createProject = async (req, res) => {
  try {
    const { name, description, teamId } = req.body;
    const userId = req.user.id;

    // Check if user is a member of the team with ADMIN or MANAGER role
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a team member to create projects',
      });
    }

    // Check if user has permission to create projects (ADMIN or MANAGER only)
    if (!['ADMIN', 'MANAGER'].includes(teamMember.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only team ADMINs and MANAGERs can create projects',
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        teamId,
        createdById: userId,
        members: {
          create: {
            userId,
            role: teamMember.role,
          },
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all projects for the current user
 */
const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.query;

    const whereClause = {
      members: {
        some: {
          userId,
        },
      },
      isActive: true,
    };

    if (teamId) {
      whereClause.teamId = teamId;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get project by ID
 */
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId,
          },
        },
        isActive: true,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        taskLabels: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update project
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check if user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!projectMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Only admins and managers can update project details
    if (!['ADMIN', 'MANAGER'].includes(projectMember.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can update project details',
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject },
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Add member to project
 */
const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId: memberUserId, role = 'DEVELOPER' } = req.body;
    const userId = req.user.id;

    // Check if current user can add members (admin/manager)
    const currentMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: { in: ['ADMIN', 'MANAGER'] },
      },
    });

    if (!currentMember) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can add project members',
      });
    }

    // Check if user exists and is part of the team
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamId: true },
    });

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: project.teamId,
        userId: memberUserId,
      },
    });

    if (!teamMember) {
      return res.status(400).json({
        success: false,
        message: 'User must be a team member to be added to the project',
      });
    }

    // Check if user is already a project member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: memberUserId,
      },
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a project member',
      });
    }

    // Add user to project
    const projectMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: memberUserId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project member added successfully',
      data: { projectMember },
    });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Remove member from project
 */
const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;

    // Check if current user can remove members (admin/manager)
    const currentMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: { in: ['ADMIN', 'MANAGER'] },
      },
    });

    if (!currentMember) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and managers can remove project members',
      });
    }

    // Remove project member
    await prisma.projectMember.delete({
      where: {
        id: memberId,
        projectId,
      },
    });

    res.json({
      success: true,
      message: 'Project member removed successfully',
    });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get project activity
 */
const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!projectMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.',
      });
    }

    const activities = [];

    // Recent task activities (last 30 days)
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId,
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        assignee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 15,
    });

    recentTasks.forEach(task => {
      // Task completion
      if (task.status === 'DONE') {
        activities.push({
          id: `task-done-${task.id}`,
          type: 'task_completed',
          message: `Task "${task.title}" was completed`,
          user: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unknown',
          timestamp: task.updatedAt,
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
          },
        });
      }

      // Task creation
      if (task.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        activities.push({
          id: `task-created-${task.id}`,
          type: 'task_created',
          message: `Task "${task.title}" was created`,
          user: task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'Unknown',
          timestamp: task.createdAt,
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
          },
        });
      }

      // Task assignment
      if (task.assignee && task.assigneeId) {
        activities.push({
          id: `task-assigned-${task.id}`,
          type: 'task_assigned',
          message: `Task "${task.title}" was assigned to ${task.assignee.firstName} ${task.assignee.lastName}`,
          user: 'System',
          timestamp: task.updatedAt,
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
            assigneeId: task.assigneeId,
          },
        });
      }
    });

    // Recent project member additions (last 30 days)
    const recentMembers = await prisma.projectMember.findMany({
      where: {
        projectId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    recentMembers.forEach(member => {
      activities.push({
        id: `member-added-${member.id}`,
        type: 'member_added',
        message: `${member.user.firstName} ${member.user.lastName} joined the project`,
        user: 'System',
        timestamp: member.createdAt,
        metadata: {
          memberId: member.id,
          userId: member.userId,
          role: member.role,
        },
      });
    });

    // Recent comments (last 30 days)
    const recentComments = await prisma.comment.findMany({
      where: {
        task: {
          projectId,
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    recentComments.forEach(comment => {
      activities.push({
        id: `comment-${comment.id}`,
        type: 'comment_added',
        message: `${comment.author.firstName} ${comment.author.lastName} commented on "${comment.task.title}"`,
        user: `${comment.author.firstName} ${comment.author.lastName}`,
        timestamp: comment.createdAt,
        metadata: {
          commentId: comment.id,
          taskId: comment.taskId,
          taskTitle: comment.task.title,
        },
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: { activities: activities.slice(0, 20) }, // Return top 20 activities
    });
  } catch (error) {
    console.error('Get project activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete project
 */
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user is admin/lead of the project or team admin
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: { in: ['ADMIN', 'LEAD'] },
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const isTeamAdmin = project.team.members.length > 0;

    if (!projectMember && !isTeamAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only project leads/admins or team admins can delete projects',
      });
    }

    // Check if project has active tasks
    const activeTasks = await prisma.task.count({
      where: {
        projectId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
    });

    if (activeTasks > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project with active tasks. Please complete or remove all tasks first.',
      });
    }

    // Delete project (this will cascade delete project members and tasks due to foreign key constraints)
    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectActivity,
};
