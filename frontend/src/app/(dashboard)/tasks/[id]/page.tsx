'use client';

import { useParams } from 'next/navigation';
import { Box, Typography, CircularProgress, MenuItem, TextField, Paper } from '@mui/material';
import { useTask, useUpdateTask } from '@/features/tasks/hooks';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: task, isLoading } = useTask(params.id);
  const updateTask = useUpdateTask();

  if (isLoading) return <CircularProgress />;
  if (!task) return <Typography>Task not found</Typography>;

  const handleStatusChange = (newStatus: string) => {
    updateTask.mutate({ id: task.id, status: newStatus });
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        {task.title}
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {task.description && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            {task.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <TextField
              select
              size="small"
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              sx={{ display: 'block', mt: 0.5 }}
            >
              <MenuItem value="todo">Todo</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Priority</Typography>
            <Typography sx={{ textTransform: 'capitalize' }}>{task.priority}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Assignee</Typography>
            <Typography>{task.assignee?.name ?? '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Project</Typography>
            <Typography>{task.project?.name ?? '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Due Date</Typography>
            <Typography>{task.dueDate ?? '—'}</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
