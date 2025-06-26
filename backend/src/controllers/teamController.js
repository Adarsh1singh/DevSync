const prisma = require('../config/database');

/**
 * Create a new team
 */
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

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

module.exports = {
  createTeam,
  getUserTeams,
  getTeamById,
  updateTeam,
  addTeamMember,
  removeTeamMember,
};
