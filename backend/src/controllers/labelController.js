const prisma = require('../config/database');

/**
 * Get labels for a project
 */
const getProjectLabels = async (req, res) => {
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
        message: 'Access denied to this project',
      });
    }

    const labels = await prisma.taskLabel.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: { labels },
    });
  } catch (error) {
    console.error('Get project labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Create a label for a project
 */
const createProjectLabel = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, color } = req.body;
    const userId = req.user.id;

    // Check if user has admin/manager role in the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: {
          in: ['ADMIN', 'MANAGER'],
        },
      },
    });

    if (!projectMember) {
      return res.status(403).json({
        success: false,
        message: 'Only project admins and managers can create labels',
      });
    }

    // Check if label with same name already exists in project
    const existingLabel = await prisma.taskLabel.findFirst({
      where: {
        projectId,
        name,
      },
    });

    if (existingLabel) {
      return res.status(400).json({
        success: false,
        message: 'A label with this name already exists in the project',
      });
    }

    const label = await prisma.taskLabel.create({
      data: {
        name,
        color,
        projectId,
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${projectId}`).emit('label-created', {
      label,
      createdBy: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: { label },
    });
  } catch (error) {
    console.error('Create project label error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete a project label
 */
const deleteProjectLabel = async (req, res) => {
  try {
    const { projectId, labelId } = req.params;
    const userId = req.user.id;

    // Check if user has admin/manager role in the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: {
          in: ['ADMIN', 'MANAGER'],
        },
      },
    });

    if (!projectMember) {
      return res.status(403).json({
        success: false,
        message: 'Only project admins and managers can delete labels',
      });
    }

    // Check if label exists and belongs to the project
    const label = await prisma.taskLabel.findFirst({
      where: {
        id: labelId,
        projectId,
      },
    });

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Label not found',
      });
    }

    await prisma.taskLabel.delete({
      where: { id: labelId },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${projectId}`).emit('label-deleted', {
      labelId,
      deletedBy: req.user,
    });

    res.json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    console.error('Delete project label error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getProjectLabels,
  createProjectLabel,
  deleteProjectLabel,
};
