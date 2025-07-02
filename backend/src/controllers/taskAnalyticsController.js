const prisma = require('../config/database');

/**
 * Get task analytics for the user
 */
const getTaskAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month', projectId } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Base where clause for user's accessible tasks
    const baseWhereClause = {
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
    };

    // Add project filter if specified
    if (projectId) {
      baseWhereClause.projectId = projectId;
    }

    // 1. Task Status Distribution
    const statusDistribution = await prisma.task.groupBy({
      by: ['status'],
      where: baseWhereClause,
      _count: {
        id: true,
      },
    });

    // 2. Priority Distribution
    const priorityDistribution = await prisma.task.groupBy({
      by: ['priority'],
      where: baseWhereClause,
      _count: {
        id: true,
      },
    });

    // 3. Task Completion Trend (daily for the period)
    const completionTrend = await prisma.task.findMany({
      where: {
        ...baseWhereClause,
        status: 'DONE',
        updatedAt: {
          gte: startDate,
        },
      },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });

    // Group completion trend by day
    const trendData = {};
    const currentDate = new Date(startDate);
    
    // Initialize all days with 0
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split('T')[0];
      trendData[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count completions per day
    completionTrend.forEach(task => {
      const dateKey = task.updatedAt.toISOString().split('T')[0];
      if (trendData[dateKey] !== undefined) {
        trendData[dateKey]++;
      }
    });

    // Convert to array format for charts
    const trendArray = Object.entries(trendData).map(([date, count]) => ({
      date,
      count,
      name: new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
    }));

    // 4. User-wise task breakdown (assignees)
    const userBreakdown = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        ...baseWhereClause,
        assigneeId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Get user details for the breakdown
    const userIds = userBreakdown.map(item => item.assigneeId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const userBreakdownWithNames = userBreakdown.map(item => {
      const user = users.find(u => u.id === item.assigneeId);
      return {
        userId: item.assigneeId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        taskCount: item._count.id,
      };
    });

    // 5. Overall statistics
    const totalTasks = await prisma.task.count({
      where: baseWhereClause,
    });

    const completedTasks = await prisma.task.count({
      where: {
        ...baseWhereClause,
        status: 'DONE',
      },
    });

    const overdueTasks = await prisma.task.count({
      where: {
        ...baseWhereClause,
        dueDate: {
          lt: now,
        },
        status: {
          not: 'DONE',
        },
      },
    });

    const tasksThisPeriod = await prisma.task.count({
      where: {
        ...baseWhereClause,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // 6. Average completion time
    const completedTasksWithDates = await prisma.task.findMany({
      where: {
        ...baseWhereClause,
        status: 'DONE',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgCompletionTime = 0;
    if (completedTasksWithDates.length > 0) {
      const totalTime = completedTasksWithDates.reduce((acc, task) => {
        const timeDiff = task.updatedAt.getTime() - task.createdAt.getTime();
        return acc + timeDiff;
      }, 0);
      avgCompletionTime = totalTime / completedTasksWithDates.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate,
          end: now,
        },
        statusDistribution: statusDistribution.map(item => ({
          name: item.status.replace('_', ' '),
          value: item._count.id,
          status: item.status,
        })),
        priorityDistribution: priorityDistribution.map(item => ({
          name: item.priority,
          value: item._count.id,
        })),
        completionTrend: trendArray,
        userBreakdown: userBreakdownWithNames,
        statistics: {
          totalTasks,
          completedTasks,
          overdueTasks,
          tasksThisPeriod,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          avgCompletionTime: Math.round(avgCompletionTime * 10) / 10, // Round to 1 decimal
        },
      },
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get task analytics for a specific project
 */
const getProjectTaskAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { period = 'month' } = req.query;
    const userId = req.user.id;

    // Check if user has access to the project
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

    // Use the same analytics logic but with project filter
    req.query.projectId = projectId;
    return getTaskAnalytics(req, res);
  } catch (error) {
    console.error('Get project task analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getTaskAnalytics,
  getProjectTaskAnalytics,
};
