import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Loader2, BarChart3 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTasks, updateTask, setFilters } from '../../store/slices/tasksSlice';
import CreateTaskModal from '../../components/Tasks/CreateTaskModal';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal';
import TaskCard from '../../components/Tasks/TaskCard';
import TaskFilters from '../../components/Tasks/TaskFilters';
import TaskAnalytics from '../../components/Tasks/TaskAnalytics';
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
import { toast } from 'react-hot-toast';
import type { Task } from '../../types';
import type { TaskFilters as TaskFiltersType } from '../../services/tasksService';

const TasksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading, error, filters } = useAppSelector((state) => state.tasks);
  const [view, setView] = useState<'list' | 'kanban' | 'analytics'>('kanban');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

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
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as 'TODO' | 'IN_PROGRESS' | 'DONE';

    const task = safeTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      try {
        await dispatch(updateTask({
          taskId,
          taskData: { status: newStatus }
        })).unwrap();
        toast.success(`Task moved to ${newStatus.replace('_', ' ').toLowerCase()}`);
      } catch (error) {
        toast.error('Failed to update task status');
      }
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailOpen(true);
  };

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    dispatch(setFilters(newFilters));
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
            onClick={() => dispatch(fetchTasks({}))}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <TaskCard
          task={task}
          onClick={() => handleTaskClick(task.id)}
          isDragging={isDragging}
          className="cursor-grab active:cursor-grabbing"
        />
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
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">
            Manage and track your tasks across all projects.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                view === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4 mr-1 inline" />
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                view === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4 mr-1 inline" />
              List
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                view === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-1 inline" />
              Analytics
            </button>
          </div>
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

      {/* Filters */}
      <TaskFilters onFiltersChange={handleFiltersChange} />

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
              <TaskCard
                task={activeTask}
                isDragging={true}
                className="shadow-lg rotate-3"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {safeTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => handleTaskClick(task.id)}
            />
          ))}
          {safeTasks.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <Plus className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first task.</p>
              <button
                onClick={() => {
                  setCreateTaskStatus('TODO');
                  setIsCreateModalOpen(true);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Task
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analytics View */}
      {view === 'analytics' && (
        <TaskAnalytics />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultStatus={createTaskStatus}
      />

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={isTaskDetailOpen}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTaskId(null);
          }}
          taskId={selectedTaskId}
        />
      )}
    </div>
  );
};

export default TasksPage;
