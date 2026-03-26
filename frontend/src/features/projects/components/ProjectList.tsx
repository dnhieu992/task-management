'use client';

import { useState } from 'react';
import { Box, Card, CardContent, CardActionArea, Typography, Button, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useProjects } from '../hooks';
import CreateProjectModal from './CreateProjectModal';

export default function ProjectList() {
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Projects</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Create Project
        </Button>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {projects?.map((project) => (
          <Card key={project.id}>
            <CardActionArea onClick={() => router.push(`/projects/${project.id}`)}>
              <CardContent>
                <Typography variant="h6">{project.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.description || 'No description'}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {projects?.length === 0 && (
          <Typography color="text.secondary">No projects yet. Create one to get started!</Typography>
        )}
      </Box>
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}
