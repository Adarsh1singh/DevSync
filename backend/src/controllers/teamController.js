const prisma = require('../config/database');

/**
 * Create a new team
 */
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check if user has permission to create teams
    // Only users with ADMIN or MANAGER role in at least one team can create new teams
    // For first-time users (no teams), allow team creation
    const existingMemberships = await prisma.teamMember.findMany({
      where: { userId },
    });

    // If user has existing memberships, check if they have ADMIN or MANAGER role
    if (existingMemberships.length > 0) {
      const hasPermission = existingMemberships.some(
        membership => membership.role === 'ADMIN' || membership.role === 'MANAGER'
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Only users with ADMIN or MANAGER role can create teams',
        });
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId,
            role: 'ADMIN', // Creator becomes admin
          },
        },
      },
      include: {
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

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: { team },
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all teams for the current user
 */
const getUserTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
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
        projects: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get team by ID
 */
const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
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
        projects: {
          include: {
            _count: {
              select: {
                tasks: true,
                members: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or access denied',
      });
    }

    res.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error('Get team by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update team
 */
const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check if user is admin of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team admins can update team details',
      });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
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
      message: 'Team updated successfully',
      data: { team: updatedTeam },
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Add member to team
 */
const addTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'DEVELOPER' } = req.body;
    const userId = req.user.id;

    // Check if current user is admin of the team
    const isAdmin = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only team admins can add members',
      });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: userToAdd.id,
      },
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a team member',
      });
    }

    // Add user to team
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: userToAdd.id,
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
      message: 'Team member added successfully',
      data: { teamMember },
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Remove member from team
 */
const removeTeamMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.user.id;

    // Check if current user is admin of the team
    const isAdmin = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only team admins can remove members',
      });
    }

    // Remove team member
    await prisma.teamMember.delete({
      where: {
        id: memberId,
        teamId,
      },
    });

    res.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete team
 */
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Check if current user is admin of the team
    const isAdmin = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only team admins can delete teams',
      });
    }

    // Check if team has active projects
    const activeProjects = await prisma.project.count({
      where: {
        teamId,
        isActive: true,
      },
    });

    if (activeProjects > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team with active projects. Please deactivate or transfer projects first.',
      });
    }

    // Delete team (this will cascade delete team members due to foreign key constraints)
    await prisma.team.delete({
      where: { id: teamId },
    });

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get team activity
 */
const getTeamActivity = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this team.',
      });
    }

    // Get team projects
    const teamProjects = await prisma.project.findMany({
      where: { teamId },
      select: { id: true },
    });

    const projectIds = teamProjects.map(p => p.id);

    // Get recent activities
    const activities = [];

    // Recent task completions (last 30 days)
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'DONE',
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
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    recentTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task_completed',
        message: `Task "${task.title}" was completed in ${task.project.name}`,
        user: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unknown',
        timestamp: task.updatedAt,
        metadata: {
          taskId: task.id,
          projectId: task.projectId,
        },
      });
    });

    // Recent project creations
    const recentProjects = await prisma.project.findMany({
      where: {
        teamId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        createdBy: {
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

    recentProjects.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project_created',
        message: `Project "${project.name}" was created`,
        user: `${project.createdBy.firstName} ${project.createdBy.lastName}`,
        timestamp: project.createdAt,
        metadata: {
          projectId: project.id,
        },
      });
    });

    // Recent member joins
    const recentMembers = await prisma.teamMember.findMany({
      where: {
        teamId,
        joinedAt: {
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
        joinedAt: 'desc',
      },
      take: 5,
    });

    recentMembers.forEach(member => {
      activities.push({
        id: `member-${member.id}`,
        type: 'member_joined',
        message: `${member.user.firstName} ${member.user.lastName} joined the team`,
        user: 'System',
        timestamp: member.joinedAt,
        metadata: {
          memberId: member.id,
          userId: member.userId,
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
    console.error('Get team activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get global team activity for user
 */
const getGlobalTeamActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all teams user is a member of
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const teamIds = userTeams.map(tm => tm.teamId);

    if (teamIds.length === 0) {
      return res.json({
        success: true,
        data: { activities: [] },
      });
    }

    // Get all projects for user's teams
    const teamProjects = await prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      select: { id: true, teamId: true },
    });

    const projectIds = teamProjects.map(p => p.id);

    const activities = [];

    // Recent task completions (last 7 days)
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'DONE',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        assignee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        project: {
          include: {
            team: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    recentTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task_completed',
        message: `Task "${task.title}" was completed in ${task.project.team.name}`,
        user: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unknown',
        timestamp: task.updatedAt,
        teamName: task.project.team.name,
      });
    });

    // Recent team member joins (last 7 days)
    const recentMembers = await prisma.teamMember.findMany({
      where: {
        teamId: { in: teamIds },
        joinedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
      take: 5,
    });

    recentMembers.forEach(member => {
      activities.push({
        id: `member-${member.id}`,
        type: 'member_joined',
        message: `${member.user.firstName} ${member.user.lastName} joined ${member.team.name}`,
        user: 'System',
        timestamp: member.joinedAt,
        teamName: member.team.name,
      });
    });

    // Recent team creations (last 7 days)
    const recentTeams = await prisma.team.findMany({
      where: {
        id: { in: teamIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        members: {
          where: { role: 'ADMIN' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    });

    recentTeams.forEach(team => {
      const admin = team.members[0];
      activities.push({
        id: `team-${team.id}`,
        type: 'team_created',
        message: `${team.name} was created`,
        user: admin ? `${admin.user.firstName} ${admin.user.lastName}` : 'Unknown',
        timestamp: team.createdAt,
        teamName: team.name,
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: { activities: activities.slice(0, 10) }, // Return top 10 activities
    });
  } catch (error) {
    console.error('Get global team activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createTeam,
  getUserTeams,
  getTeam: getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamActivity,
  getGlobalTeamActivity,
};
