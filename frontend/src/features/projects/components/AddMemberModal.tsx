'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import { useAddMember } from '../hooks';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function AddMemberModal({ open, onClose, projectId }: Props) {
  const [email, setEmail] = useState('');
  const addMember = useAddMember(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember.mutate({ email }, {
      onSuccess: () => {
        setEmail('');
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          {addMember.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Could not add member. User may not exist or is already a member.
            </Alert>
          )}
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={addMember.isPending}>
            {addMember.isPending ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
