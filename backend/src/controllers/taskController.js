const prisma = require('../config/database');

/**
 * Create a new task
 */
const createTask = async (req, res) => {
  try {
    const { title, description, priority = 'MEDIUM', dueDate, assigneeId, projectId } = req.body;
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

    // If assigneeId is provided, check if assignee is a project member
    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: assigneeId,
        },
      });

      if (!assigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a project member',
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId,
        createdById: userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${projectId}`).emit('task-created', {
      task,
      createdBy: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get tasks for a project
 */
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assigneeId, priority, search, dueDate } = req.query;
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

    const whereClause = { projectId };

    if (status) {
      whereClause.status = status;
    }
    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }
    if (priority) {
      whereClause.priority = priority;
    }
    if (dueDate) {
      whereClause.dueDate = {
        lte: new Date(dueDate),
      };
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        labels: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get task by ID
 */
const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        labels: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update task
 */
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const userId = req.user.id;

    // Get task with project info
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    // If assigneeId is provided, check if assignee is a project member
    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findFirst({
        where: {
          projectId: existingTask.projectId,
          userId: assigneeId,
        },
      });

      if (!assigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a project member',
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${existingTask.projectId}`).emit('task-updated', {
      task: updatedTask,
      updatedBy: req.user,
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask },
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete task
 */
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the task and is creator or has admin/manager role
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            members: {
              where: {
                userId,
              },
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    const userRole = task.project.members[0]?.role;
    const canDelete = task.createdById === userId || ['ADMIN', 'MANAGER'].includes(userRole);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Only task creator, admins, or managers can delete tasks',
      });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${task.projectId}`).emit('task-deleted', {
      taskId,
      deletedBy: req.user,
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get user's assigned tasks
 */
const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, search, projectId, dueDate } = req.query;

    const whereClause = {
      AND: [
        {
          OR: [
            { assigneeId: userId },
            { createdById: userId },
            {
              project: {
                members: {
                  some: {
                    userId,
                  },
                },
              },
            },
          ],
        },
      ],
    };

    if (status) {
      whereClause.AND.push({ status });
    }
    if (priority) {
      whereClause.AND.push({ priority });
    }
    if (projectId) {
      whereClause.AND.push({ projectId });
    }
    if (dueDate) {
      whereClause.AND.push({
        dueDate: {
          lte: new Date(dueDate),
        },
      });
    }
    if (search) {
      whereClause.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getUserTasks,
};
