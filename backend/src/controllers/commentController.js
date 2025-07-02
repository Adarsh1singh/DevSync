const prisma = require('../config/database');

/**
 * Create a new comment on a task
 */
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
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
      select: {
        id: true,
        projectId: true,
        title: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${task.projectId}`).emit('comment-added', {
      comment,
      task: {
        id: task.id,
        title: task.title,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get comments for a task
 */
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
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
      select: {
        id: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied',
      });
    }

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    console.error('Get task comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update a comment
 */
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if user owns the comment
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        userId,
      },
      include: {
        task: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or access denied',
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${existingComment.task.projectId}`).emit('comment-updated', {
      comment: updatedComment,
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment: updatedComment },
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete a comment
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if user owns the comment or has admin/manager role in the project
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
      },
      include: {
        task: {
          select: {
            id: true,
            projectId: true,
            project: {
              select: {
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
        },
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const userRole = comment.task.project.members[0]?.role;
    const canDelete = comment.userId === userId || ['ADMIN', 'MANAGER'].includes(userRole);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Only comment author, admins, or managers can delete comments',
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`project-${comment.task.projectId}`).emit('comment-deleted', {
      commentId,
      taskId: comment.task.id,
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createTaskComment: createComment,
  getTaskComments,
  updateComment,
  deleteTaskComment: deleteComment,
};
