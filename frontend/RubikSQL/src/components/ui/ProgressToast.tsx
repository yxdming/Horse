import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader2, RotateCcw, Clock, Info, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { taskQueueManager, Task } from '@/services/TaskQueueManager';

// Default position from bottom (in pixels)
const DEFAULT_BOTTOM_OFFSET = 60;
const RIGHT_OFFSET = 16;

// React-like hook for components
function useTaskQueue() {
  const [tasks, setTasks] = React.useState<Task[]>([]);

  React.useEffect(() => {
    setTasks(taskQueueManager.getTasks());

    const unsubscribe = taskQueueManager.subscribe(() => {
      setTasks(taskQueueManager.getTasks());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    tasks: tasks.filter(t => t.status !== 'dismissed'),
    activeTasks: tasks.filter(t => t.status === 'running'),
    addTask: taskQueueManager.addTask.bind(taskQueueManager),
    dismissTask: taskQueueManager.dismissTask.bind(taskQueueManager),
    retryTask: taskQueueManager.retryTask.bind(taskQueueManager),
  };
}

export const ProgressToast = () => {
  const { t } = useTranslation();
  const { tasks, dismissTask, retryTask } = useTaskQueue();
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState({ bottom: DEFAULT_BOTTOM_OFFSET });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0, bottom: 0 });

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only start drag on the header (grip area)
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true);
      setDragStart({
        y: e.clientY,
        bottom: position.bottom
      });
      e.preventDefault();
    }
  }, [position.bottom]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = dragStart.y - e.clientY;
    const newBottom = dragStart.bottom + deltaY;

    // Constrain to window bounds (keep some margin from top and bottom)
    const maxBottom = window.innerHeight - 100; // Keep at least 100px from top
    const minBottom = 60; // Keep at least 60px from bottom
    const clampedBottom = Math.max(minBottom, Math.min(maxBottom, newBottom));

    setPosition({ bottom: clampedBottom });
  }, [isDragging, dragStart]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Only show relevant tasks (filter out old completed tasks after 5 minutes)
  const relevantTasks = tasks.filter(t => {
    if (t.status === 'running' || t.status === 'pending') return true;
    if (t.status === 'completed' || t.status === 'error') {
      // Show completed/error tasks for 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return t.updatedAt > fiveMinutesAgo;
    }
    return false;
  });

  if (relevantTasks.length === 0) return null;

  const activeCount = relevantTasks.filter(t => t.status === 'running').length;
  const completedCount = relevantTasks.filter(t => t.status === 'completed').length;
  const errorCount = relevantTasks.filter(t => t.status === 'error').length;
  const pendingCount = relevantTasks.filter(t => t.status === 'pending').length;

  return (
    <div
      className="fixed z-[1400] bg-white rounded-lg shadow-lg border border-[#E5E7EB] min-w-[320px] max-w-[400px]"
      style={{
        right: RIGHT_OFFSET,
        bottom: position.bottom
      }}
    >
      {/* Header with drag handle */}
      <div
        className={cn(
          "flex items-center justify-between p-3 border-b border-[#E5E7EB]",
          "cursor-grab active:cursor-grabbing select-none"
        )}
        data-drag-handle
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <div className="flex items-center justify-center w-4 h-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#404040]" />
              </div>
            )}
            <span className="text-sm font-medium text-[#1A1A1A]">
              {t('taskQueue:title', 'Task Queue')}
            </span>
          </div>
          <div className="flex gap-1 text-xs">
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-[0.25rem]">
                {activeCount} {t('taskQueue:active', 'active')}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-[0.25rem]">
                {pendingCount} {t('taskQueue:pending', 'pending')}
              </span>
            )}
            {completedCount > 0 && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-[0.25rem]">
                {completedCount}
              </span>
            )}
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-[0.25rem]">
                {errorCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[#6B7280] hover:text-[#1A1A1A] transition-colors rounded hover:bg-gray-100"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={() => {
              // Dismiss all completed/error tasks
              relevantTasks.forEach(t => {
                if (t.status === 'completed' || t.status === 'error') {
                  dismissTask(t.id);
                }
              });
            }}
            className="p-1 text-[#6B7280] hover:text-[#1A1A1A] transition-colors rounded hover:bg-gray-100"
            title="Clear completed"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Task List */}
      {isExpanded && (
        <div className="max-h-[400px] overflow-y-auto">
          {relevantTasks
            .sort((a, b) => {
              // Sort by status first (running/pending first), then by time
              const statusOrder: { [key in Task['status']]: number } = {
                running: 0,
                pending: 1,
                error: 2,
                completed: 3,
                dismissed: 999
              };
              const aOrder = statusOrder[a.status] || 999;
              const bOrder = statusOrder[b.status] || 999;
              if (aOrder !== bOrder) return aOrder - bOrder;
              return b.updatedAt.getTime() - a.updatedAt.getTime();
            })
            .map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onDismiss={() => dismissTask(task.id)}
                onRetry={() => retryTask(task.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
};

interface TaskItemProps {
  task: Task;
  onDismiss: () => void;
  onRetry: () => void;
}

const TaskItem = ({ task, onDismiss, onRetry }: TaskItemProps) => {
  const { t } = useTranslation();
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);
  const [isTaskExpanded, setIsTaskExpanded] = useState(false);

  // Auto-dismiss completed/error tasks after 3 seconds
  React.useEffect(() => {
    if (task.status === 'completed' || task.status === 'error') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [task.status, onDismiss]);

  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTaskTypeColor = () => {
    switch (task.type) {
      case 'kb-build':
      case 'kb-rebuild':
      case 'kb-sync':
        return 'border-l-blue-200';
      case 'add-knowledge':
      case 'add-experience':
      case 'add-taxonomy':
      case 'knowledge-upsert':
        return 'border-l-green-200';
      case 'query':
        return 'border-l-amber-200';
      case 'export':
        return 'border-l-purple-200';
      default:
        return 'border-l-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Get elapsed time for running tasks
  const getElapsedTime = () => {
    if (task.status !== 'running' || !task.startedAt) return '';
    const elapsed = Date.now() - task.startedAt.getTime();
    return formatDuration(elapsed);
  };

  return (
    <div
      className={cn(
        'p-3 border-l-2 transition-all duration-200 hover:bg-gray-50',
        getTaskTypeColor(),
        task.status === 'completed' && 'bg-green-50',
        task.status === 'error' && 'bg-red-50'
      )}
    >
      <div
        className="flex items-start justify-between mb-1 cursor-pointer"
        onClick={() => setIsTaskExpanded(!isTaskExpanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </span>
          {task.duration && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatDuration(task.duration)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Expansion chevron moved to right side to align with controls */}
          {isTaskExpanded ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
          {task.status === 'error' && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
              title="Retry"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {/* Cancel button removed - tasks should not be cancellable from UI */}
          {(task.status === 'completed' || task.status === 'error') && (
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for running tasks */}
      {task.status === 'running' && task.progress > 0 && (
        <div className="mb-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-600">
              {task.message || `${task.progress}%`}
            </span>
            {getElapsedTime() && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {getElapsedTime()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status messages */}
      {task.status === 'pending' && (
        <div className="text-xs text-gray-600">
          {t('taskQueue:waitingToStart', 'Waiting to start...')}
        </div>
      )}

      {task.status === 'completed' && task.message && (
        <div className="text-xs text-green-700">
          {task.message}
        </div>
      )}

      {task.status === 'error' && (
        <div className="text-xs text-red-700">
          <div
            className="cursor-pointer hover:text-red-800 flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); setIsErrorExpanded(!isErrorExpanded); }}
          >
            <AlertCircle size={12} />
            <span>
              {task.error ?
                (task.error.length > 50 && !isErrorExpanded ?
                  `${task.error.substring(0, 50)}...` :
                  task.error
                ) :
                t('taskQueue:taskFailed', 'Task failed')
              }
            </span>
            {task.error && task.error.length > 50 && (
              <Info size={12} className="ml-1" />
            )}
          </div>
          {task.error && isErrorExpanded && (
            <div className="mt-1 p-2 bg-red-50 rounded text-xs break-all">
              {task.error}
            </div>
          )}
        </div>
      )}

      {/* Expanded task details */}
      {isTaskExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          {/* Task type */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{t('taskQueue:type')}</span>
            <span className="text-gray-900">{task.type}</span>
          </div>

          {/* Status with better formatting */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{t('taskQueue:status')}</span>
            <span className={cn(
              task.status === 'running' && 'text-blue-600',
              task.status === 'completed' && 'text-green-600',
              task.status === 'error' && 'text-red-600',
              task.status === 'pending' && 'text-gray-600'
            )}>
              {t(`taskQueue:statusValues.${task.status}`, task.status)}
            </span>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{t('taskQueue:progress')}</span>
            <span className="text-gray-900">{task.progress}%</span>
          </div>

          {/* Time information */}
          {task.createdAt && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('taskQueue:created')}</span>
              <span className="text-gray-900">
                {task.createdAt.toLocaleTimeString()}
              </span>
            </div>
          )}

          {task.startedAt && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('taskQueue:started')}</span>
              <span className="text-gray-900">
                {task.startedAt.toLocaleTimeString()}
              </span>
            </div>
          )}

          {task.completedAt && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('taskQueue:completed')}</span>
              <span className="text-gray-900">
                {task.completedAt.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Duration for completed tasks */}
          {task.duration && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('taskQueue:duration')}</span>
              <span className="text-gray-900">
                {formatDuration(task.duration)}
              </span>
            </div>
          )}

          {/* Time elapsed for running tasks */}
          {task.status === 'running' && task.startedAt && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('taskQueue:timeElapsed')}</span>
              <span className="text-gray-900">
                <Clock size={12} className="inline mr-1" />
                {formatDuration(Date.now() - task.startedAt.getTime())}
              </span>
            </div>
          )}

          {/* Task ID */}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{t('taskQueue:id')}</span>
            <span className="text-gray-900 font-mono">
              {task.id.split('-')[1]} {/* Show only the short ID */}
            </span>
          </div>

          {/* Database name */}
          {task.metadata?.databaseId && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('taskQueue:database')}</span>
              <span className="text-gray-900">{task.metadata.databaseId}</span>
            </div>
          )}

          {/* Database name if available */}
          {task.metadata?.databaseName && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{t('taskQueue:dbName')}</span>
              <span className="text-gray-900">{task.metadata.databaseName}</span>
            </div>
          )}

          {/* Additional metadata */}
          {task.metadata && Object.keys(task.metadata).length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">{t('taskQueue:metadata')}</span>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs space-y-0.5">
                {Object.entries(task.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500">{key}:</span>
                    <span className="text-gray-900 break-all max-w-[200px]">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show database name if not expanded */}
      {!isTaskExpanded && task.metadata?.databaseId && (
        <div className="text-xs text-gray-400 mt-1">
          {t('taskQueue:database')}: {task.metadata.databaseId}
        </div>
      )}
    </div>
  );
};