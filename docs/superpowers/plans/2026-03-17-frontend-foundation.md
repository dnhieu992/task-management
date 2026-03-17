# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the complete frontend foundation — dependencies, testing setup, shared lib (QueryClient, Providers, API clients), Zustand UI store, and App Router route structure — so all domain plans (Auth, Tasks, Projects) can build on a stable base.

**Architecture:** Domain-driven Next.js App Router app. Server Components fetch data via a per-request `api-client` factory; Client Components use React Query for mutations and Zustand for UI state. All providers are mounted in a single `Providers.tsx` Client Component in the root layout.

**Tech Stack:** Next.js 14 (App Router), TanStack React Query v5, Zustand 4, `@task-management/api-client` (workspace package), MUI (already installed), Jest + React Testing Library

**Prerequisite:** The `@task-management/api-client` package must be built before this plan. Follow the spec at `docs/superpowers/specs/2026-03-16-api-client-package-design.md` and run `npm run build:packages` from the repo root. This plan assumes `@task-management/api-client` resolves as a workspace dependency.

**Subsequent plans (not covered here):**
- `2026-03-17-frontend-shared-components.md` — Button, Input, Modal, Badge, Spinner, Card
- `2026-03-17-frontend-auth-domain.md` — Login, Register pages + auth hooks
- `2026-03-17-frontend-tasks-domain.md` — Task CRUD components + hooks
- `2026-03-17-frontend-projects-domain.md` — Project board components + hooks

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/package.json` | Modify | Add React Query, Zustand, testing dependencies |
| `frontend/jest.config.ts` | Create | Jest config for Next.js + TypeScript |
| `frontend/jest.setup.ts` | Create | Testing Library global setup |
| `frontend/src/shared/lib/queryClient.ts` | Create | `makeQueryClient()` factory with global error config |
| `frontend/src/shared/lib/Providers.tsx` | Create | `'use client'` — mounts QueryClientProvider + MuiThemeProvider |
| `frontend/src/shared/lib/api.server.ts` | Create | Per-request server-side api-client factory (reads cookies) |
| `frontend/src/shared/lib/api.client.ts` | Create | `'use client'` — browser-side api-client singleton |
| `frontend/src/store/ui.ts` | Create | Zustand store: sidebarOpen, activeTaskId |
| `frontend/src/store/index.ts` | Create | Re-exports all store slices |
| `frontend/src/app/layout.tsx` | Modify | Mount `<Providers>` instead of `<ThemeProvider>` directly |
| `frontend/src/app/not-found.tsx` | Create | Root-level 404 page |
| `frontend/src/app/(auth)/login/page.tsx` | Create | Shell — login page placeholder |
| `frontend/src/app/(auth)/register/page.tsx` | Create | Shell — register page placeholder |
| `frontend/src/app/(dashboard)/layout.tsx` | Create | Dashboard shell layout |
| `frontend/src/app/(dashboard)/page.tsx` | Create | Redirects to `/projects` |
| `frontend/src/app/(dashboard)/error.tsx` | Create | `'use client'` error boundary |
| `frontend/src/app/(dashboard)/not-found.tsx` | Create | Dashboard 404 |
| `frontend/src/app/(dashboard)/loading.tsx` | Create | Dashboard loading skeleton |
| `frontend/src/app/(dashboard)/projects/page.tsx` | Create | Shell — projects list placeholder |
| `frontend/src/app/(dashboard)/projects/error.tsx` | Create | Projects error boundary |
| `frontend/src/app/(dashboard)/projects/[id]/page.tsx` | Create | Shell — project detail placeholder |
| `frontend/src/app/(dashboard)/tasks/[id]/page.tsx` | Create | Shell — task detail placeholder |
| `frontend/src/__tests__/store/ui.test.ts` | Create | Zustand store unit tests |
| `frontend/src/__tests__/lib/queryClient.test.ts` | Create | makeQueryClient unit tests |
| `frontend/src/__tests__/lib/Providers.test.tsx` | Create | Providers render test |

---

## Task 1: Install dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install runtime dependencies**

Run from `frontend/`:
```bash
npm install @tanstack/react-query@^5 zustand@^4
```

- [ ] **Step 2: Install testing dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom ts-jest @types/jest \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Add `@task-management/api-client` workspace dependency**

Add to `frontend/package.json` under `"dependencies"`:
```json
"@task-management/api-client": "*"
```
Then from the **repo root** run:
```bash
npm install
```
This registers the workspace link. Verify: `ls frontend/node_modules/@task-management/` should show `api-client`.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): install react-query, zustand, and testing deps"
```

---

## Task 2: Configure Jest

**Files:**
- Create: `frontend/jest.config.ts`
- Create: `frontend/jest.setup.ts`

- [ ] **Step 1: Create jest.config.ts**

```ts
// frontend/jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};

export default createJestConfig(config);
```

> Note: `next/jest` automatically handles TypeScript, CSS modules, and Next.js-specific transforms.

- [ ] **Step 2: Create jest.setup.ts**

```ts
// frontend/jest.setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Add test script to package.json**

In `frontend/package.json`, add under `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Verify Jest config works**

```bash
cd frontend && npx jest --listTests
```
Expected: no error, empty list (no tests yet).

- [ ] **Step 5: Commit**

```bash
git add frontend/jest.config.ts frontend/jest.setup.ts frontend/package.json
git commit -m "feat(frontend): configure jest with next/jest and testing-library"
```

---

## Task 3: Create makeQueryClient factory

**Files:**
- Create: `frontend/src/shared/lib/queryClient.ts`
- Create: `frontend/src/__tests__/lib/queryClient.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// frontend/src/__tests__/lib/queryClient.test.ts
import { makeQueryClient } from '@/shared/lib/queryClient';
import { QueryClient } from '@tanstack/react-query';

describe('makeQueryClient', () => {
  it('returns a QueryClient instance', () => {
    const client = makeQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  it('returns a new instance on each call', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    expect(a).not.toBe(b);
  });

  it('has retry set to 1', () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- queryClient.test.ts
```
Expected: FAIL — `Cannot find module '@/shared/lib/queryClient'`

- [ ] **Step 3: Implement makeQueryClient**

```ts
// frontend/src/shared/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
      mutations: {
        onError: (error: unknown) => {
          // Dynamic import avoids circular dep and keeps this file server-safe
          if (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            (error as { status: number }).status === 401
          ) {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        },
      },
    },
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- queryClient.test.ts
```
Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/lib/queryClient.ts \
        frontend/src/__tests__/lib/queryClient.test.ts
git commit -m "feat(frontend): add makeQueryClient factory with global error config"
```

---

## Task 4: Create Providers component

**Files:**
- Create: `frontend/src/shared/lib/Providers.tsx`
- Create: `frontend/src/__tests__/lib/Providers.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/src/__tests__/lib/Providers.test.tsx
import { render, screen } from '@testing-library/react';
import { Providers } from '@/shared/lib/Providers';

describe('Providers', () => {
  it('renders children', () => {
    render(
      <Providers>
        <span>hello</span>
      </Providers>
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- Providers.test.tsx
```
Expected: FAIL — `Cannot find module '@/shared/lib/Providers'`

- [ ] **Step 3: Implement Providers**

`Providers.tsx` replaces the current root usage of `ThemeProvider` and adds `QueryClientProvider`. The existing `ThemeProvider` component (`src/components/ThemeProvider.tsx`) is kept as-is and composed here.

```tsx
// frontend/src/shared/lib/Providers.tsx
'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from './queryClient';
import ThemeProvider from '@/components/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- Providers.test.tsx
```
Expected: PASS

- [ ] **Step 5: Update root layout to use Providers**

Modify `frontend/src/app/layout.tsx`:

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Providers } from '@/shared/lib/Providers';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'Task Management',
  description: 'Task Management Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify the app still starts**

```bash
cd frontend && npm run dev
```
Open `http://localhost:3000`. Expected: app loads without error.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/shared/lib/Providers.tsx \
        frontend/src/__tests__/lib/Providers.test.tsx \
        frontend/src/app/layout.tsx
git commit -m "feat(frontend): add Providers with QueryClientProvider, update root layout"
```

---

## Task 5: Create API clients

**Files:**
- Create: `frontend/src/shared/lib/api.server.ts`
- Create: `frontend/src/shared/lib/api.client.ts`

> These files depend on `@task-management/api-client`. Ensure the package is built (`npm run build:packages` from repo root) before this task.

- [ ] **Step 1: Create the server-side API client factory**

```ts
// frontend/src/shared/lib/api.server.ts
import { createApiClient } from '@task-management/api-client';
import { cookies } from 'next/headers';

/**
 * Creates a new api-client instance per request using the auth token from cookies.
 * Call this at the top of every Server Component that needs to fetch data.
 * Never use a singleton for server-side requests — each request has its own token.
 */
export function createServerApiClient() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value ?? null;
  return createApiClient({
    baseURL: process.env.API_URL ?? 'http://localhost:3001/api',
    getToken: () => token,
  });
}
```

- [ ] **Step 2: Create the client-side API singleton**

```ts
// frontend/src/shared/lib/api.client.ts
// 'use client' — never import this file in a Server Component. Use api.server.ts instead.
'use client';

import { createApiClient } from '@task-management/api-client';

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('auth-token='));
  return match ? match.split('=')[1] : null;
}

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  getToken: getTokenFromCookie,
});
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shared/lib/api.server.ts \
        frontend/src/shared/lib/api.client.ts
git commit -m "feat(frontend): add server and client api-client factories"
```

---

## Task 6: Create Zustand UI store

**Files:**
- Create: `frontend/src/store/ui.ts`
- Create: `frontend/src/store/index.ts`
- Create: `frontend/src/__tests__/store/ui.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// frontend/src/__tests__/store/ui.test.ts
import { act } from '@testing-library/react';
import { useUIStore } from '@/store/ui';

// Reset store between tests
beforeEach(() => {
  useUIStore.setState({
    sidebarOpen: true,
    activeTaskId: null,
  });
});

describe('useUIStore', () => {
  it('has correct initial state', () => {
    const { sidebarOpen, activeTaskId } = useUIStore.getState();
    expect(sidebarOpen).toBe(true);
    expect(activeTaskId).toBeNull();
  });

  it('toggleSidebar flips sidebarOpen', () => {
    act(() => useUIStore.getState().toggleSidebar());
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    act(() => useUIStore.getState().toggleSidebar());
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('setActiveTask sets and clears activeTaskId', () => {
    act(() => useUIStore.getState().setActiveTask('task-123'));
    expect(useUIStore.getState().activeTaskId).toBe('task-123');

    act(() => useUIStore.getState().setActiveTask(null));
    expect(useUIStore.getState().activeTaskId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- ui.test.ts
```
Expected: FAIL — `Cannot find module '@/store/ui'`

- [ ] **Step 3: Implement the UI store**

```ts
// frontend/src/store/ui.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  activeTaskId: string | null;
  toggleSidebar: () => void;
  setActiveTask: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeTaskId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTask: (id) => set({ activeTaskId: id }),
}));
```

- [ ] **Step 4: Create store index**

```ts
// frontend/src/store/index.ts
export { useUIStore } from './ui';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd frontend && npm test -- ui.test.ts
```
Expected: PASS — 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/store/ui.ts \
        frontend/src/store/index.ts \
        frontend/src/__tests__/store/ui.test.ts
git commit -m "feat(frontend): add Zustand UI store with sidebar and active task state"
```

---

## Task 7: Scaffold App Router structure

**Files:** All new `app/` files listed in the file map.

- [ ] **Step 1: Create root not-found page**

```tsx
// frontend/src/app/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 — Page not found</h1>
    </div>
  );
}
```

- [ ] **Step 2: Create auth route group shells**

```tsx
// frontend/src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return <div>Login — coming soon</div>;
}
```

```tsx
// frontend/src/app/(auth)/register/page.tsx
export default function RegisterPage() {
  return <div>Register — coming soon</div>;
}
```

- [ ] **Step 3: Create dashboard layout**

```tsx
// frontend/src/app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

- [ ] **Step 4: Create dashboard redirect page**

```tsx
// frontend/src/app/(dashboard)/page.tsx
import { redirect } from 'next/navigation';

export default function DashboardIndexPage() {
  redirect('/projects');
}
```

- [ ] **Step 5: Create dashboard error boundary**

```tsx
// frontend/src/app/(dashboard)/error.tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

- [ ] **Step 6: Create dashboard not-found and loading**

```tsx
// frontend/src/app/(dashboard)/not-found.tsx
export default function DashboardNotFound() {
  return <div>404 — This page does not exist</div>;
}
```

```tsx
// frontend/src/app/(dashboard)/loading.tsx
export default function DashboardLoading() {
  return <div>Loading…</div>;
}
```

- [ ] **Step 7: Create projects shells**

```tsx
// frontend/src/app/(dashboard)/projects/page.tsx
export default function ProjectsPage() {
  return <div>Projects — coming soon</div>;
}
```

```tsx
// frontend/src/app/(dashboard)/projects/error.tsx
'use client';

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Failed to load projects</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

```tsx
// frontend/src/app/(dashboard)/projects/[id]/page.tsx
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <div>Project {params.id} — coming soon</div>;
}
```

- [ ] **Step 8: Create task detail shell**

```tsx
// frontend/src/app/(dashboard)/tasks/[id]/page.tsx
export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return <div>Task {params.id} — coming soon</div>;
}
```

- [ ] **Step 9: Verify the dev server serves all routes without error**

Start the dev server:
```bash
cd frontend && npm run dev
```

Visit each route manually:
- `http://localhost:3000/` → should redirect to `/projects`
- `http://localhost:3000/projects` → "Projects — coming soon"
- `http://localhost:3000/projects/abc` → "Project abc — coming soon"
- `http://localhost:3000/tasks/abc` → "Task abc — coming soon"
- `http://localhost:3000/login` → "Login — coming soon"
- `http://localhost:3000/register` → "Register — coming soon"
- `http://localhost:3000/nonexistent` → 404 page

All routes should load without a 500 error.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/app/
git commit -m "feat(frontend): scaffold App Router route structure with shells and error boundaries"
```

---

## Task 8: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
cd frontend && npm test
```
Expected: all tests pass (queryClient, Providers, ui store).

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```
Expected: no errors. Fix any lint errors before proceeding.

- [ ] **Step 3: Commit fixes if any**

If lint fixes were required:
```bash
git add -p
git commit -m "fix(frontend): fix lint errors in foundation scaffold"
```

---

## Completion Checklist

- [ ] `@tanstack/react-query` and `zustand` installed
- [ ] Jest configured with `next/jest`, `@testing-library/jest-dom`, `@/` alias
- [ ] `makeQueryClient()` factory implemented and tested
- [ ] `Providers.tsx` implemented and tested, mounted in root layout
- [ ] `api.server.ts` (per-request factory) implemented
- [ ] `api.client.ts` (browser singleton) implemented with `'use client'`
- [ ] `useUIStore` implemented and tested
- [ ] All App Router shells created (`(auth)`, `(dashboard)`, projects, tasks)
- [ ] All routes verified in the dev server
- [ ] All tests pass, no lint errors
