'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
import { useMyTasks } from '@/features/tasks/hooks';
import TaskListTable from '@/features/tasks/components/TaskListTable';

export default function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        My Tasks
      </Typography>
      {isLoading ? <CircularProgress /> : <TaskListTable tasks={tasks ?? []} showProject />}
    </Box>
  );
}
