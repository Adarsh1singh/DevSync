const prisma = require('../config/database');

/**
 * Create a notification
 */
const createNotification = async ({
  type,
  title,
  message,
  userId,
  projectId = null,
  io = null,
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId,
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: projectId ? {
          select: {
            id: true,
            name: true,
          },
        } : false,
      },
    });

    // Send real-time notification if io is provided
    if (io) {
      io.to(`user-${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Create task assignment notification
 */
const createTaskAssignmentNotification = async ({
  taskId,
  taskTitle,
  assigneeId,
  assignedById,
  projectId,
  io,
}) => {
  try {
    const assignedBy = await prisma.user.findUnique({
      where: { id: assignedById },
      select: { firstName: true, lastName: true },
    });

    await createNotification({
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${assignedBy.firstName} ${assignedBy.lastName} assigned you a task: "${taskTitle}"`,
      userId: assigneeId,
      projectId,
      io,
    });
  } catch (error) {
    console.error('Create task assignment notification error:', error);
  }
};

/**
 * Create task update notification
 */
const createTaskUpdateNotification = async ({
  taskId,
  taskTitle,
  assigneeId,
  updatedById,
  projectId,
  updateType,
  io,
}) => {
  try {
    if (!assigneeId || assigneeId === updatedById) {
      return; // Don't notify if no assignee or user updated their own task
    }

    const updatedBy = await prisma.user.findUnique({
      where: { id: updatedById },
      select: { firstName: true, lastName: true },
    });

    await createNotification({
      type: 'TASK_UPDATED',
      title: 'Task Updated',
      message: `${updatedBy.firstName} ${updatedBy.lastName} ${updateType} the task: "${taskTitle}"`,
      userId: assigneeId,
      projectId,
      io,
    });
  } catch (error) {
    console.error('Create task update notification error:', error);
  }
};

/**
 * Create comment notification
 */
const createCommentNotification = async ({
  taskId,
  taskTitle,
  commenterId,
  projectId,
  io,
}) => {
  try {
    // Get task assignee and creator (excluding the commenter)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assigneeId: true,
        createdById: true,
      },
    });

    const commenter = await prisma.user.findUnique({
      where: { id: commenterId },
      select: { firstName: true, lastName: true },
    });

    const usersToNotify = new Set();
    
    if (task.assigneeId && task.assigneeId !== commenterId) {
      usersToNotify.add(task.assigneeId);
    }
    
    if (task.createdById && task.createdById !== commenterId) {
      usersToNotify.add(task.createdById);
    }

    // Create notifications for all relevant users
    for (const userId of usersToNotify) {
      await createNotification({
        type: 'COMMENT_ADDED',
        title: 'New Comment',
        message: `${commenter.firstName} ${commenter.lastName} commented on task: "${taskTitle}"`,
        userId,
        projectId,
        io,
      });
    }
  } catch (error) {
    console.error('Create comment notification error:', error);
  }
};

/**
 * Create project assignment notification
 */
const createProjectAssignmentNotification = async ({
  projectId,
  projectName,
  assigneeId,
  assignedById,
  io,
}) => {
  try {
    const assignedBy = await prisma.user.findUnique({
      where: { id: assignedById },
      select: { firstName: true, lastName: true },
    });

    await createNotification({
      type: 'PROJECT_ASSIGNED',
      title: 'Added to Project',
      message: `${assignedBy.firstName} ${assignedBy.lastName} added you to project: "${projectName}"`,
      userId: assigneeId,
      projectId,
      io,
    });
  } catch (error) {
    console.error('Create project assignment notification error:', error);
  }
};

/**
 * Create team invite notification
 */
const createTeamInviteNotification = async ({
  teamId,
  teamName,
  inviteeId,
  invitedById,
  io,
}) => {
  try {
    const invitedBy = await prisma.user.findUnique({
      where: { id: invitedById },
      select: { firstName: true, lastName: true },
    });

    await createNotification({
      type: 'TEAM_INVITE',
      title: 'Team Invitation',
      message: `${invitedBy.firstName} ${invitedBy.lastName} invited you to join team: "${teamName}"`,
      userId: inviteeId,
      io,
    });
  } catch (error) {
    console.error('Create team invite notification error:', error);
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, { limit = 20, offset = 0, unreadOnly = false } = {}) => {
  try {
    const whereClause = { userId };
    
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.notification.count({
      where: whereClause,
    });

    return {
      notifications,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (error) {
    console.error('Get user notifications error:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        isRead: true,
      },
    });

    return notification;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createTaskAssignmentNotification,
  createTaskUpdateNotification,
  createCommentNotification,
  createProjectAssignmentNotification,
  createTeamInviteNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
