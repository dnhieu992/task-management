import { api } from '@/shared/lib/api.client';
import type { Task } from '@/shared/types';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
}

export const tasksApi = {
  myTasks: () => api.get<Task[]>('/tasks').then((r) => r.data),
  byProject: (projectId: string) => api.get<Task[]>(`/projects/${projectId}/tasks`).then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (projectId: string, data: CreateTaskPayload) => api.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),
  update: (id: string, data: UpdateTaskPayload) => api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};
