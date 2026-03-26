'use client';

import { useState } from 'react';
import {
  Box, List, ListItem, ListItemText, IconButton, Button, Chip, Typography,
} from '@mui/material';
import { PersonRemove, PersonAdd } from '@mui/icons-material';
import { useProjectMembers, useRemoveMember } from '../hooks';
import AddMemberModal from './AddMemberModal';

interface Props {
  projectId: string;
  isOwner: boolean;
}

export default function MemberList({ projectId, isOwner }: Props) {
  const { data: members } = useProjectMembers(projectId);
  const removeMember = useRemoveMember(projectId);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Members</Typography>
        {isOwner && (
          <Button size="small" startIcon={<PersonAdd />} onClick={() => setAddOpen(true)}>
            Add Member
          </Button>
        )}
      </Box>
      <List dense>
        {members?.map((m) => (
          <ListItem
            key={m.id}
            secondaryAction={
              isOwner && m.role !== 'owner' ? (
                <IconButton edge="end" onClick={() => removeMember.mutate(m.userId)}>
                  <PersonRemove />
                </IconButton>
              ) : null
            }
          >
            <ListItemText primary={m.user.name} secondary={m.user.email} />
            {m.role === 'owner' && <Chip label="Owner" size="small" color="primary" />}
          </ListItem>
        ))}
      </List>
      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} projectId={projectId} />
    </Box>
  );
}
