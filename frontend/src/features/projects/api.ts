import { api } from '@/shared/lib/api.client';
import type { Project, ProjectMember } from '@/shared/types';

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: string;
}

export interface AddMemberPayload {
  email: string;
}

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: CreateProjectPayload) => api.post<Project>('/projects', data).then((r) => r.data),
  update: (id: string, data: UpdateProjectPayload) => api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
  getMembers: (id: string) => api.get<ProjectMember[]>(`/projects/${id}/members`).then((r) => r.data),
  addMember: (id: string, data: AddMemberPayload) => api.post<ProjectMember>(`/projects/${id}/members`, data).then((r) => r.data),
  removeMember: (projectId: string, userId: string) => api.delete(`/projects/${projectId}/members/${userId}`).then((r) => r.data),
};
