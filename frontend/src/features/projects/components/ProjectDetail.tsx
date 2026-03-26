'use client';

import { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Divider } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useProject, useProjectMembers } from '../hooks';
import { useProjectTasks } from '@/features/tasks/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import MemberList from './MemberList';
import TaskListTable from '@/features/tasks/components/TaskListTable';
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal';

interface Props {
  projectId: string;
}

export default function ProjectDetail({ projectId }: Props) {
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  const { data: currentUser } = useCurrentUser();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  if (projectLoading || membersLoading) return <CircularProgress />;
  if (!project) return <Typography>Project not found</Typography>;

  const isOwner = project.ownerId === currentUser?.id;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {project.name}
      </Typography>
      {project.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {project.description}
        </Typography>
      )}

      <MemberList projectId={projectId} isOwner={isOwner} />

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Tasks</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateTaskOpen(true)}>
          Create Task
        </Button>
      </Box>

      {tasksLoading ? <CircularProgress /> : <TaskListTable tasks={tasks ?? []} />}

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={projectId}
        members={members ?? []}
      />
    </Box>
  );
}
