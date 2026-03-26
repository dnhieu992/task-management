'use client';

import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Link as MuiLink } from '@mui/material';
import NextLink from 'next/link';
import { useLogin } from '../hooks';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 400, mx: 'auto', mt: 8, px: 2 }}
    >
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      {login.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Invalid email or password
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
      <TextField
        label="Password"
        type="password"
        fullWidth
        required
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={login.isPending}
      >
        {login.isPending ? 'Logging in...' : 'Login'}
      </Button>
      <Typography sx={{ mt: 2, textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <MuiLink component={NextLink} href="/register">
          Register
        </MuiLink>
      </Typography>
    </Box>
  );
}
