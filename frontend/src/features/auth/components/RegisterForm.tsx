'use client';

import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import { useRegister } from '../hooks';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ name, email, password });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 400, mx: 'auto', mt: 8, px: 2 }}
    >
      <Typography variant="h4" gutterBottom>
        Register
      </Typography>
      {register.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Registration failed. Email may already be in use.
        </Alert>
      )}
      {register.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Account created! Please login.
        </Alert>
      )}
      <TextField
        label="Name"
        fullWidth
        required
        margin="normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        type="email"
        fullWidth
        required
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        required
        margin="normal"
        inputProps={{ minLength: 6 }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={register.isPending}
      >
        {register.isPending ? 'Creating account...' : 'Register'}
      </Button>
      <Typography sx={{ mt: 2, textAlign: 'center' }}>
        Already have an account?{' '}
        <MuiLink component={NextLink} href="/login">
          Login
        </MuiLink>
      </Typography>
    </Box>
  );
}
