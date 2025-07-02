const prisma = require('../config/database');

/**
 * Assign a label to a task
 */
const assignLabelToTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the task
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

    // Check if label exists and belongs to the same project
    const label = await prisma.taskLabel.findFirst({
      where: {
        id: labelId,
        projectId: task.project.id,
      },
    });

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Label not found or does not belong to this project',
      });
    }

    // Check if label is already assigned to the task
    const existingAssignment = await prisma.task.findFirst({
      where: {
        id: taskId,
        labels: {
          some: {
            id: labelId,
          },
        },
      },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Label is already assigned to this task',
      });
    }

    // Assign the label to the task
    await prisma.task.update({
      where: { id: taskId },
      data: {
        labels: {
          connect: { id: labelId },
        },
      },
    });

    // Get updated task with labels
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${task.project.id}`).emit('task-label-assigned', {
      task: updatedTask,
      label,
      assignedBy: req.user,
    });

    res.json({
      success: true,
      message: 'Label assigned to task successfully',
      data: { task: updatedTask },
    });
  } catch (error) {
    console.error('Assign label to task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Remove a label from a task
 */
const removeLabelFromTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the task
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

    // Check if label is assigned to the task
    const taskWithLabel = await prisma.task.findFirst({
      where: {
        id: taskId,
        labels: {
          some: {
            id: labelId,
          },
        },
      },
    });

    if (!taskWithLabel) {
      return res.status(400).json({
        success: false,
        message: 'Label is not assigned to this task',
      });
    }

    // Remove the label from the task
    await prisma.task.update({
      where: { id: taskId },
      data: {
        labels: {
          disconnect: { id: labelId },
        },
      },
    });

    // Get updated task with labels
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        labels: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${task.project.id}`).emit('task-label-removed', {
      task: updatedTask,
      labelId,
      removedBy: req.user,
    });

    res.json({
      success: true,
      message: 'Label removed from task successfully',
      data: { task: updatedTask },
    });
  } catch (error) {
    console.error('Remove label from task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  assignLabelToTask,
  removeLabelFromTask,
};
