const prisma = require('../config/database');

/**
 * Create a new project
 */
const createProject = async (req, res) => {
  try {
    const { name, description, teamId } = req.body;
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
        message: 'You must be a team member to create projects',
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

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  addProjectMember,
  removeProjectMember,
};
