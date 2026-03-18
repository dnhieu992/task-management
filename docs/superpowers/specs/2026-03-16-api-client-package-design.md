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
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.ts
    ├── src/
    │   ├── index.ts
    │   ├── client.ts
    │   ├── interceptors/
    │   │   ├── auth.ts
    │   │   └── error.ts
    │   └── types.ts
    └── dist/                 # gitignored, compiled output
```

## Monorepo Setup

### Root `package.json`

Only `packages/*` is added to npm workspaces. `frontend` and `backend` remain standalone packages — they continue to be installed and run independently using `--prefix`. This avoids hoisting conflicts between Next.js and NestJS dependencies.

```json
{
  "name": "task-management",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:fe": "npm run dev --prefix frontend",
    "dev:be": "npm run start:dev --prefix backend",
    "install:fe": "npm install --prefix frontend",
    "install:be": "npm install --prefix backend",
    "install:all": "npm install && npm run install:fe && npm run install:be",
    "build:packages": "npm run build --workspace=packages/api-client"
  }
}
```

> After this change, run `npm install` from the root to register the workspace. The `frontend` and `backend` packages are still installed with `--prefix` as before.

### Package `package.json`

```json
{
  "name": "@task-management/api-client",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "jest",
    "prepare": "npm run build"
  },
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "jest": "^29",
    "ts-jest": "^29",
    "@types/jest": "^29"
  }
}
```

The `exports` map only declares the `require` condition because the build output is CJS. CJS is compatible with Next.js (which handles CJS via its bundler) and React Native's Metro bundler. No ESM build is produced.

### Package `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "CommonJS",
    "lib": ["ES2019"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Package `jest.config.ts`

```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
```

### Build Workflow

- Run `npm run build:packages` from the root before starting the frontend for the first time.
- In development, run `npm run dev` inside `packages/api-client/` to watch for changes.
- The `prepare` script ensures the package is built automatically on `npm install`.

## Architecture

### `client.ts`

Exports `createApiClient(config: ClientConfig): AxiosInstance`.

- Creates an axios instance with `baseURL` (defaults to `http://localhost:3001/api`) and `timeout` (defaults to 10000ms)
- Registers auth and error interceptors
- Returns the configured instance

### `interceptors/auth.ts`

- Awaits `config.getToken()` before each request (supports both sync and async token sources)
- Attaches `Authorization: Bearer <token>` if token is non-null
- If no token, request proceeds without an auth header

### `interceptors/error.ts`

- Intercepts non-2xx responses and network errors (no response)
- For response errors: `status` from `error.response.status`; `message` extracted from `error.response.data.message` if present, otherwise falls back to `error.message`; `data` set to the full `error.response.data`
- For network errors (no `error.response`, e.g. timeout, DNS failure): `status = 0`, `message` from `error.message`
- Re-throws as an `ApiError` instance

## Types

```ts
export interface ClientConfig {
  baseURL?: string;
  timeout?: number;
  getToken?: () => string | null | Promise<string | null>;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Required for reliable instanceof checks when compiled to older targets
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
```

## Usage Examples

**Next.js client-side component:**
```ts
import { createApiClient } from '@task-management/api-client';

const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  getToken: () => localStorage.getItem('token'), // browser only
});
```

> `localStorage` is not available in server contexts (SSR, Server Components). Resolve the token before passing it when using the client server-side.

**Next.js server-side:**
```ts
const api = createApiClient({
  baseURL: process.env.API_URL,
  getToken: () => resolvedTokenFromCookies, // pre-resolved string
});
```

**React Native (future):**
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = createApiClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  getToken: () => AsyncStorage.getItem('token'), // returns Promise<string | null>
});
```

## Error Handling

`ApiError` extends `Error`, so `instanceof Error` checks work and error monitoring tools (e.g., Sentry) capture it correctly.

```ts
try {
  const res = await api.get('/tasks');
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.status, err.message);
  }
}
```

Network errors (timeout, DNS failure) result in `ApiError` with `status = 0`.

## Testing

Jest with `ts-jest`, `testEnvironment: 'node'`. Run via `npm test` inside `packages/api-client/`.

Test cases:
1. Auth interceptor attaches `Authorization` header when `getToken` returns a non-null string
2. Auth interceptor skips header when `getToken` returns `null`
3. Auth interceptor resolves an async `getToken` before attaching the header
4. Error interceptor normalizes a 4xx/5xx response into `ApiError` with correct `status` and `message`
5. Error interceptor normalizes a network error (no response) into `ApiError` with `status = 0`
6. `ApiError` instance passes `instanceof ApiError` and `instanceof Error`

## Out of Scope

- Typed resource methods (e.g., `tasksApi.getAll()`) — these belong in feature-level modules in the frontend/mobile apps
- Token storage or refresh logic — delegated to consumers via `getToken` callback
- Request caching or retry logic
