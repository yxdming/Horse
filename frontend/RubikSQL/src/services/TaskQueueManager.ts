import React from 'react';

export interface Task {
  id: string;
  type: 'kb-build' | 'kb-rebuild' | 'kb-sync' | 'knowledge-upsert' | 'add-knowledge' | 'add-experience' | 'add-taxonomy' | 'query' | 'export';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'dismissed';
  progress: number;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
}

export class TaskQueueManager {
  private tasks: Map<string, Task> = new Map();
  private queue: Task[] = [];
  private maxConcurrent: number = 3;
  private running: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();
  private nextId: number = 1;

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  public getTasks(): Task[] {
    return Array.from(this.tasks.values()).sort((a, b) =>
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  public getActiveTasks(): Task[] {
    return this.getTasks().filter(t => t.status === 'running' || t.status === 'pending');
  }

  private generateId(): string {
    return `task-${this.nextId++}-${Date.now()}`;
  }

  public addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt' | 'duration'>): string {
    // Prevent conflicts - only one operation per database
    const conflictingTypes = ['kb-build', 'kb-rebuild', 'kb-sync'];
    if (conflictingTypes.includes(task.type)) {
      this.cancelConflictingTasks(conflictingTypes as any, task.metadata?.databaseId);
    }

    const id = this.generateId();
    const now = new Date();
    const fullTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(id, fullTask);

    if (this.canStartTask()) {
      this.startTask(fullTask);
    } else {
      this.queue.push(fullTask);
    }

    this.notifyListeners();
    return id;
  }

  private canStartTask(): boolean {
    return this.running.size < this.maxConcurrent;
  }

  private startTask(task: Task) {
    // Tasks are managed by the components that create them
    // This is just for queue management and conflict prevention
    task.status = 'running';
    task.startedAt = new Date();
    task.updatedAt = task.startedAt;
    this.running.add(task.id);
    this.notifyListeners();
  }

  private cancelConflictingTasks(taskTypes: string | string[], identifier?: string) {
    if (!identifier) return;

    const types = Array.isArray(taskTypes) ? taskTypes : [taskTypes];

    this.getTasks().forEach(task => {
      if (types.includes(task.type) &&
          task.metadata?.databaseId === identifier &&
          (task.status === 'pending' || task.status === 'running')) {
        // Inline cancellation logic: remove from queue or running and mark as error
        const queueIndex = this.queue.findIndex(t => t.id === task.id);
        if (queueIndex >= 0) this.queue.splice(queueIndex, 1);
        this.running.delete(task.id);
        task.status = 'error';
        task.error = 'Cancelled by conflicting task';
        task.updatedAt = new Date();
      }
    });
  }

  public updateTask(id: string, updates: Partial<Task>) {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
      task.updatedAt = new Date();
      this.notifyListeners();
    }
  }

  public completeTask(id: string, status: 'completed' | 'error', message?: string) {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      task.progress = status === 'completed' ? 100 : task.progress;
      task.completedAt = new Date();
      task.updatedAt = task.completedAt;

      // Calculate duration
      if (task.startedAt) {
        task.duration = task.completedAt.getTime() - task.startedAt.getTime();
      }

      if (message) {
        if (status === 'error') {
          task.error = message;
        } else {
          task.message = message;
        }
      }
      this.running.delete(id);
      this.notifyListeners();

      // Start next task in queue
      this.processQueue();
    }
  }

  private processQueue() {
    while (this.canStartTask() && this.queue.length > 0) {
      const nextTask = this.queue.shift()!;
      this.startTask(nextTask);
    }
  }

  // Note: explicit task cancellation via API/UI was removed. Conflicting tasks are
  // marked as errors internally by `cancelConflictingTasks` when needed.

  public dismissTask(id: string) {
    const task = this.tasks.get(id);
    if (task && (task.status === 'completed' || task.status === 'error')) {
      // Keep tasks for 5 minutes before actual removal
      setTimeout(() => {
        this.tasks.delete(id);
        this.notifyListeners();
      }, 5 * 60 * 1000);

      // Hide immediately by updating status
      task.status = 'dismissed';
      this.notifyListeners();
    }
  }

  public retryTask(id: string) {
    const task = this.tasks.get(id);
    if (task && task.status === 'error') {
      // Reset and retry
      task.status = 'pending';
      task.progress = 0;
      task.error = undefined;
      task.updatedAt = new Date();

      this.queue.push(task);
      this.processQueue();
      this.notifyListeners();
    }
  }
}

// Singleton instance
export const taskQueueManager = new TaskQueueManager();

// Helper function to add tasks from the UI
export function addTask(type: Task['type'], title: string, metadata?: Record<string, any>) {
  return taskQueueManager.addTask({
    type,
    title,
    status: 'pending',
    progress: 0,
    metadata
  });
}

// Helper function to complete a task by finding it by type and metadata
export function completeTaskByType(type: Task['type'], metadata: Partial<Record<string, any>>, status: 'completed' | 'error' = 'completed', message?: string) {
  const tasks = taskQueueManager.getTasks().filter(t =>
    t.type === type &&
    Object.entries(metadata).every(([key, value]) => t.metadata?.[key] === value)
  );

  if (tasks.length > 0) {
    taskQueueManager.completeTask(tasks[0].id, status, message);
  }
}

// Helper function to update a task by finding it by type and metadata
export function updateTaskByType(type: Task['type'], metadata: Partial<Record<string, any>>, updates: Partial<Pick<Task, 'progress' | 'message' | 'status'>>) {
  const tasks = taskQueueManager.getTasks().filter(t =>
    t.type === type &&
    Object.entries(metadata).every(([key, value]) => t.metadata?.[key] === value)
  );

  if (tasks.length > 0) {
    taskQueueManager.updateTask(tasks[0].id, updates);
  }
}

// React-like hook for components
export function useTaskQueue() {
  const [tasks, setTasks] = React.useState<Task[]>([]);

  React.useEffect(() => {
    setTasks(taskQueueManager.getTasks());

    const unsubscribe = taskQueueManager.subscribe(() => {
      setTasks(taskQueueManager.getTasks());
    });
    return unsubscribe;
  }, []);

  return {
    tasks: tasks.filter(t => t.status !== 'dismissed'),
    activeTasks: tasks.filter(t => t.status === 'running'),
    addTask: taskQueueManager.addTask.bind(taskQueueManager),
    dismissTask: taskQueueManager.dismissTask.bind(taskQueueManager),
    retryTask: taskQueueManager.retryTask.bind(taskQueueManager),
  };
}