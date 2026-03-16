# API Client Package Design

**Date:** 2026-03-16
**Status:** Approved

## Overview

Create a shared `@task-management/api-client` package in `packages/api-client/` that provides a configured axios-based HTTP client for communicating with the NestJS backend. The package is designed to be consumed by the Next.js frontend today, and by a React Native mobile app in the future.

## Goals

- Provide a single, reusable HTTP client configured for the task management backend
- Centralize auth token injection and error normalization
- Keep the package dependency-free except for `axios`
- Be portable across web (Next.js) and mobile (React Native) consumers

## Package Structure

```
packages/
└── api-client/
    ├── package.json          # name: @task-management/api-client
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts          # public exports
    │   ├── client.ts         # axios instance factory
    │   ├── interceptors/
    │   │   ├── auth.ts       # attaches Bearer token to requests
    │   │   └── error.ts      # normalizes errors into ApiError type
    │   └── types.ts          # ApiError, ClientConfig
    └── dist/                 # compiled output (gitignored)
```

## Architecture

### Monorepo Setup

The root `package.json` will be updated to declare npm workspaces covering `frontend`, `backend`, and `packages/*`. This allows consumers to import `@task-management/api-client` as a local package without publishing to npm.

### `client.ts` — Factory Function

Exports `createApiClient(config: ClientConfig): AxiosInstance`.

- Creates a new axios instance with `baseURL` (defaults to `http://localhost:3001/api`)
- Registers auth and error interceptors
- Returns the configured instance for use by consumers

### `interceptors/auth.ts` — Request Interceptor

- Calls `config.getToken()` before each outgoing request
- If a token is returned, sets `Authorization: Bearer <token>` on the request headers
- If no token, the request proceeds without an auth header (supports public endpoints)
- `getToken` is an optional callback, keeping the package decoupled from any specific auth library or storage mechanism

### `interceptors/error.ts` — Response Interceptor

- Intercepts all non-2xx responses
- Normalizes the axios error into a typed `ApiError` object with `status`, `message`, and optional `data`
- Re-throws the normalized error so all consumers handle errors consistently with `try/catch`

## Types

```ts
export interface ClientConfig {
  baseURL?: string;
  getToken?: () => string | null;
}

export interface ApiError {
  status: number;
  message: string;
  data?: unknown;
}
```

## Usage Example

```ts
import { createApiClient } from '@task-management/api-client';

const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  getToken: () => localStorage.getItem('token'),
});

const res = await api.get('/health');
```

## Error Handling

All API errors are normalized to `ApiError`. Consumers should wrap calls in `try/catch`:

```ts
try {
  const res = await api.get('/tasks');
} catch (err) {
  const apiErr = err as ApiError;
  console.error(apiErr.status, apiErr.message);
}
```

## Out of Scope

- Typed resource methods (e.g., `tasksApi.getAll()`) — these belong in feature-level modules in the frontend/mobile apps
- Token storage or refresh logic — delegated to consumers via `getToken` callback
- Request caching or retry logic
