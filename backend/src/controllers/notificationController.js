const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../services/notificationService');

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const result = await getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await markNotificationAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: `${result.count} notifications marked as read`,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserNotifications(userId, {
      limit: 1,
      offset: 0,
      unreadOnly: true,
    });

    res.json({
      success: true,
      data: { unreadCount: result.totalCount },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
