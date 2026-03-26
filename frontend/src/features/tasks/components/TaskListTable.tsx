'use client';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
} from '@mui/material';
import TaskStatusBadge from './TaskStatusBadge';
import type { Task } from '@/shared/types';

interface Props {
  tasks: Task[];
  showProject?: boolean;
}

export default function TaskListTable({ tasks, showProject = false }: Props) {
  if (tasks.length === 0) {
    return <Typography color="text.secondary">No tasks yet.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Assignee</TableCell>
            {showProject && <TableCell>Project</TableCell>}
            <TableCell>Due Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} hover>
              <TableCell>{task.title}</TableCell>
              <TableCell><TaskStatusBadge status={task.status} /></TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{task.priority}</TableCell>
              <TableCell>{task.assignee?.name ?? '—'}</TableCell>
              {showProject && <TableCell>{task.project?.name ?? '—'}</TableCell>}
              <TableCell>{task.dueDate ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
