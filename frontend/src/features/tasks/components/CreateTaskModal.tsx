'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem,
} from '@mui/material';
import { useCreateTask } from '../hooks';
import type { ProjectMember } from '@/shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: ProjectMember[];
}

export default function CreateTaskModal({ open, onClose, projectId, members }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const createTask = useCreateTask(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate(
      {
        title,
        description: description || undefined,
        assigneeId: assigneeId || undefined,
        priority,
        dueDate: dueDate || undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setAssigneeId('');
          setPriority('medium');
          setDueDate('');
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            required
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Assignee"
            fullWidth
            select
            margin="normal"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {members.map((m) => (
              <MenuItem key={m.userId} value={m.userId}>
                {m.user.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Priority"
            fullWidth
            select
            margin="normal"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          <TextField
            label="Due Date"
            fullWidth
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createTask.isPending}>
            {createTask.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
