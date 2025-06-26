import React from 'react';
import AnalyticsChart from './AnalyticsChart';

const AnalyticsDashboard: React.FC = () => {
  // Mock data for analytics - will be replaced with real data from Redux store
  const taskCompletionData = [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 19 },
    { name: 'Wed', value: 8 },
    { name: 'Thu', value: 15 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 6 },
    { name: 'Sun', value: 4 },
  ];

  const taskStatusData = [
    { name: 'To Do', value: 24 },
    { name: 'In Progress', value: 18 },
    { name: 'Done', value: 42 },
    { name: 'Blocked', value: 6 },
  ];

  const projectProgressData = [
    { name: 'DevSync Platform', value: 75 },
    { name: 'Mobile App', value: 45 },
    { name: 'Design System', value: 100 },
    { name: 'API Gateway', value: 30 },
    { name: 'Documentation', value: 60 },
  ];

  const teamPerformanceData = [
    { name: 'Jan', value: 85 },
    { name: 'Feb', value: 92 },
    { name: 'Mar', value: 78 },
    { name: 'Apr', value: 88 },
    { name: 'May', value: 95 },
    { name: 'Jun', value: 89 },
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Overview</h2>
        <p className="text-muted-foreground mt-1">
          Track your team's performance and project progress.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <AnalyticsChart
          type="line"
          data={taskCompletionData}
          title="Task Completion This Week"
          height={300}
        />

        {/* Task Status Distribution */}
        <AnalyticsChart
          type="pie"
          data={taskStatusData}
          title="Task Status Distribution"
          height={300}
        />

        {/* Project Progress */}
        <AnalyticsChart
          type="bar"
          data={projectProgressData}
          title="Project Progress (%)"
          height={300}
        />

        {/* Team Performance */}
        <AnalyticsChart
          type="line"
          data={teamPerformanceData}
          title="Team Performance (Monthly)"
          height={300}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">94%</p>
            <p className="text-sm text-muted-foreground">On-time Delivery</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">2.3</p>
            <p className="text-sm text-muted-foreground">Avg. Days per Task</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">87%</p>
            <p className="text-sm text-muted-foreground">Team Satisfaction</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">156</p>
            <p className="text-sm text-muted-foreground">Tasks This Month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
