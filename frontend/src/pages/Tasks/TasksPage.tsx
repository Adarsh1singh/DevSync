import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Calendar, User, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks, updateTask } from '../../store/slices/tasksSlice';
import CreateTaskModal from '../../components/Tasks/CreateTaskModal';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';

const TasksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading, error } = useAppSelector((state) => state.tasks);
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Group tasks by status for kanban view
  const groupedTasks = {
    TODO: safeTasks.filter(task => task.status === 'TODO'),
    IN_PROGRESS: safeTasks.filter(task => task.status === 'IN_PROGRESS'),
    DONE: safeTasks.filter(task => task.status === 'DONE'),
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = safeTasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as 'TODO' | 'IN_PROGRESS' | 'DONE';

    const task = safeTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      dispatch(updateTask({
        taskId,
        taskData: { status: newStatus }
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchTasks())}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Sortable Task Card Component
  const SortableTaskCard = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
      >
        {/* Task Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Task Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.labels.map((label: any, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {typeof label === 'string' ? label : label.name}
              </span>
            ))}
          </div>
        )}

        {/* Task Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {task.assignee && (
              <div className="flex items-center space-x-1">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span>
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              </div>
            )}
            {task.project && (
              <span className="text-xs text-gray-400">• {task.project.name}</span>
            )}
          </div>
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Droppable Column Component
  const DroppableColumn = ({
    id,
    title,
    tasks,
    bgColor = "bg-gray-50",
    badgeColor = "bg-gray-200 text-gray-700"
  }: {
    id: string;
    title: string;
    tasks: Task[];
    bgColor?: string;
    badgeColor?: string;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id,
    });

    const handleAddTask = () => {
      setCreateTaskStatus(id as 'TODO' | 'IN_PROGRESS' | 'DONE');
      setIsCreateModalOpen(true);
    };

    return (
      <div
        ref={setNodeRef}
        className={`${bgColor} rounded-lg p-4 min-h-[500px] transition-colors ${
          isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <span className={`${badgeColor} px-2 py-1 rounded-full text-xs`}>
            {tasks.length}
          </span>
        </div>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
            <button
              onClick={handleAddTask}
              className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4 mx-auto mb-1" />
              <span className="text-sm">Add a task</span>
            </button>
          </div>
        </SortableContext>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your tasks across all projects.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 border border-border px-4 py-2 rounded-lg hover:bg-accent transition-colors">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setCreateTaskStatus('TODO');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="pl-10 pr-4 py-2 w-80 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              view === 'kanban'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              view === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DroppableColumn
              id="TODO"
              title="To Do"
              tasks={groupedTasks.TODO}
              bgColor="bg-gray-50"
              badgeColor="bg-gray-200 text-gray-700"
            />
            <DroppableColumn
              id="IN_PROGRESS"
              title="In Progress"
              tasks={groupedTasks.IN_PROGRESS}
              bgColor="bg-blue-50"
              badgeColor="bg-blue-100 text-blue-800"
            />
            <DroppableColumn
              id="DONE"
              title="Done"
              tasks={groupedTasks.DONE}
              bgColor="bg-green-50"
              badgeColor="bg-green-100 text-green-800"
            />
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg rotate-3">
                <h3 className="font-medium text-gray-900 text-sm">{activeTask.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activeTask.priority)}`}>
                  {activeTask.priority}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">All Tasks</h2>
          </div>
          <div className="divide-y divide-border">
            {safeTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-foreground">{task.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{task.project?.name || 'No Project'}</span>
                      {task.assignee && (
                        <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                      )}
                      {task.dueDate && (
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultStatus={createTaskStatus}
      />
    </div>
  );
};

export default TasksPage;
