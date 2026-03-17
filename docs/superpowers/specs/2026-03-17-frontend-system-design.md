# Frontend System Design

**Date:** 2026-03-17
**Status:** Approved

## Overview

A holistic frontend architecture for the task management Next.js app. Organized around domain-driven modules, mixed Server/Client rendering, React Query for server state, and Zustand for UI state. Designed to scale to a large codebase while remaining maintainable by a growing team.

## Goals

- Organize code by business domain, not by file type
- Maximize Server Component usage for performance; use Client Components only for interactivity
- Establish a clear boundary between server state (React Query) and UI state (Zustand)
- Define a 3-tier component hierarchy that prevents coupling between unrelated domains
- Handle errors consistently at the right layer

## Scope

Core features only: tasks (CRUD), projects/boards, basic auth.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Server state:** TanStack React Query v5
- **UI state:** Zustand
- **HTTP client:** `@task-management/api-client` (existing shared package)

---

## Section 1 — Folder & Module Structure

Code is organized by domain. Everything related to a feature lives together.

```
frontend/src/
├── app/                          # Next.js App Router — routing only
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── error.tsx             # catches unhandled errors in this segment
│   │   ├── not-found.tsx         # 404 for this segment
│   │   ├── loading.tsx
│   │   ├── page.tsx              # calls redirect('/projects') from next/navigation
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   └── [id]/page.tsx
│   │   └── tasks/
│   │       └── [id]/page.tsx
│   ├── layout.tsx                # mounts <Providers> — root layout
│   └── not-found.tsx             # root-level 404, covers (auth) and any unmatched route
│
├── domains/                      # Business domains — the core of the architecture
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm
│   │   ├── hooks/                # pure React hooks with no API calls: useAuthRedirect
│   │   ├── store.ts              # Zustand: auth-specific UI state (if any)
│   │   ├── api.ts                # React Query hooks: useCurrentUserQuery, useLoginMutation
│   │   └── types.ts
│   ├── tasks/
│   │   ├── components/           # TaskCard, TaskList, TaskForm, TaskDetail, TaskDetailActions
│   │   ├── hooks/                # pure React hooks: useTaskFilters, useTaskSort
│   │   ├── api.ts                # React Query hooks: useTasksQuery, useCreateTaskMutation
│   │   └── types.ts
│   └── projects/
│       ├── components/           # ProjectCard, ProjectBoard, ProjectSidebar
│       ├── hooks/                # pure React hooks with no API calls
│       ├── api.ts                # React Query hooks: useProjectsQuery, useProjectQuery
│       └── types.ts
│
├── shared/                       # No domain knowledge — purely reusable
│   ├── components/               # Button, Input, Modal, Spinner, Badge, Card
│   ├── hooks/                    # useDebounce, useLocalStorage, usePagination
│   ├── lib/
│   │   ├── queryClient.ts        # QueryClient singleton with global error config
│   │   ├── Providers.tsx         # 'use client' — mounts QueryClientProvider + ZustandProvider
│   │   ├── api.server.ts         # server-side api-client factory (reads cookies)
│   │   └── api.client.ts         # client-side api-client singleton (reads localStorage/cookie)
│   └── types/                    # Pagination, ApiResponse, etc.
│
└── store/                        # Global Zustand store — layout-level UI state only
    ├── ui.ts                     # sidebarOpen, activeModal — shared across domains
    └── index.ts                  # exports all slices (each is a separate create() call)
```

**`api.ts` vs `hooks/` distinction:** Every domain has both:
- `api.ts` — contains only React Query hooks (`useQuery`, `useMutation`). These are the only files that call the API.
- `hooks/` — contains pure React hooks with no API calls. Examples: `useTaskFilters` (derives a filtered list from local state), `useTaskSort` (sorts a pre-fetched list by a field). If a hook calls `useQuery` or `useMutation`, it belongs in `api.ts`, not `hooks/`.

**Boundary rule:** A domain may import from `shared/` but never from another domain. Cross-domain communication happens through the Zustand store or URL state. Pages in `app/` are the only place where domain components are composed together.

**Global vs. domain-level Zustand:** Layout-level UI state shared across domains (sidebar, active modal) lives in `store/ui.ts`. Domain-specific UI state not shared across domains (e.g., an auth-specific redirect flag) lives in `domains/[domain]/store.ts`. When in doubt, start in `store/ui.ts` and move to a domain store only if it becomes clearly domain-specific.

---

## Section 2 — Rendering Architecture

**Default: Server Components.** Every file is a Server Component unless it explicitly opts in with `'use client'`.

A component becomes a Client Component when it needs:
- `useState` or `useReducer`
- `useEffect`
- Event handlers (`onClick`, `onChange`, etc.)
- React Query hooks (which rely on context)
- Zustand store access

### Provider setup

`QueryClientProvider` (and any other context providers) must be mounted inside a Client Component because providers use React context. Create `shared/lib/Providers.tsx`:

```tsx
// shared/lib/Providers.tsx
'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from './queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use useState so each browser session gets its own QueryClient instance.
  // Do NOT instantiate QueryClient at module level here — Next.js can share
  // module-level singletons across requests on the server.
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Mount it in the root layout (a Server Component can render a Client Component child):

```tsx
// app/layout.tsx
import { Providers } from '@/shared/lib/Providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Rendering layers

```
app/(dashboard)/projects/[id]/page.tsx     ← Server Component
│   Fetches project + tasks server-side
│   Passes resolved data as props to domain components
│
├── domains/projects/components/ProjectBoard.tsx   ← Server Component
│   Renders layout, receives task list as props
│
├── domains/tasks/components/TaskList.tsx          ← Server Component
│   Receives Task[] as props, maps → TaskCard
│
└── domains/tasks/components/TaskCard.tsx          ← Client Component ('use client')
    Needs onClick, hover state, drag interactions
```

### Data fetching strategy

| Layer | Who fetches | How |
|---|---|---|
| Page (`app/`) | Server Component | `async/await` with `api.server.ts` factory |
| Mutations | Client Component | React Query `useMutation` via `api.ts` hooks |
| Refetch after mutation | Client Component | React Query `invalidateQueries` |
| Global UI state | Client Component | Zustand store |

Server Components fetch the full initial data and pass it as props. Client Components use React Query only for mutations and post-mutation refetches — not for the initial page load. This prevents double-fetching.

> **Note on React Query hydration:** The `prefetchQuery` / `dehydrate` / `HydrationBoundary` pattern (seeding the client cache with server-fetched data) is intentionally deferred. For the current scope, Server Components pass data as props and Client Components refetch after mutations via `invalidateQueries`. This is sufficient for core features and simpler to reason about.

### Server-side API client

The `api-client` package requires a `getToken` callback. In Server Components, the token comes from request cookies, not `localStorage`.

```ts
// shared/lib/api.server.ts
import { createApiClient } from '@task-management/api-client';
import { cookies } from 'next/headers';

export function createServerApiClient() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value ?? null;
  return createApiClient({
    baseURL: process.env.API_URL,
    getToken: () => token,
  });
}
```

Usage in a Server Component page:

```ts
// app/(dashboard)/projects/[id]/page.tsx
import { createServerApiClient } from '@/shared/lib/api.server';

export default async function ProjectPage({ params }) {
  const api = createServerApiClient();
  const [project, tasks] = await Promise.all([
    api.get(`/projects/${params.id}`),
    api.get(`/projects/${params.id}/tasks`),
  ]);
  return <ProjectBoard project={project} tasks={tasks} />;
}
```

A new `api` instance is created per request — this is intentional. Never use a singleton `api` instance on the server because the token differs per request.

### Client-side API client

```ts
// shared/lib/api.client.ts
// 'use client' — never import this file in a Server Component. Use api.server.ts instead.
'use client';
import { createApiClient } from '@task-management/api-client';

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  getToken: () => document.cookie // or read from cookie utility
    .split('; ')
    .find(row => row.startsWith('auth-token='))
    ?.split('=')[1] ?? null,
});
```

This singleton is safe for client-side use because it runs in the browser where each user has their own session.

---

## Section 3 — State Management

Two tools with strictly separated responsibilities.

### React Query — server state

All data that originates from or is persisted to the API goes through React Query hooks in `api.ts`.

```ts
// domains/tasks/api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api.client';

export const useTasksQuery = (projectId: string) =>
  useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasks`),
  });

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => api.post('/tasks', data),
    onSuccess: (_, { projectId }) =>
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
};
```

Query keys are cache identifiers — treat them as a contract. Invalidating `['tasks', projectId]` triggers a refetch everywhere that key is used.

### Zustand — UI state

Only state with no server equivalent lives in Zustand. Each slice is a separate `create()` call.

```ts
// store/ui.ts
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

`store/index.ts` re-exports all slice hooks — it does not combine them (Zustand has no combineReducers):

```ts
// store/index.ts
export { useUIStore } from './ui';
```

### Decision rule

| Question | Use |
|---|---|
| Does this data come from or go to the API? | React Query (`api.ts`) |
| Would refreshing the page reset this state? | Zustand |
| Is this a loading/error state for a request? | React Query (built-in) |
| Is this UI-only (open/closed, selected)? | Zustand |

### Auth

The session token is stored in an httpOnly cookie managed by the server. `useCurrentUserQuery` is a React Query hook — the user object comes from the API. Zustand does not store auth data.

---

## Section 4 — Component Architecture

Three tiers. A lower tier never imports from a higher tier.

### Tier 1 — `shared/components/` (Design System)

Zero business logic. Zero domain knowledge. Accepts only primitives as props.

```
shared/components/
├── Button/     # variants: primary, secondary, ghost, danger
├── Input/      # text, textarea, select — controlled only
├── Modal/      # portal-based, accepts children
├── Badge/      # status colors: open, in-progress, done
├── Spinner/    # loading indicator
└── Card/       # generic container with shadow/border
```

### Tier 2 — `domains/*/components/` (Domain Components)

Composed from Tier 1. Contain business logic and domain types. Know about React Query and Zustand.

```
domains/tasks/components/
├── TaskCard.tsx          # 'use client' — clickable, shows badge, title, assignee
├── TaskList.tsx          # Server Component — receives Task[] as prop, maps → TaskCard
├── TaskForm.tsx          # 'use client' — form with validation, calls useCreateTaskMutation
├── TaskDetail.tsx        # Server Component — full task view, receives Task as prop
└── TaskDetailActions.tsx # 'use client' — Edit button that opens TaskForm modal
```

**`TaskDetail` pattern:** `TaskDetail` is a Server Component that renders the task data. It cannot have an `onClick` handler directly. The Edit button lives in `TaskDetailActions` (a small Client Component child). This keeps the expensive render on the server and limits the client bundle to the interactive button only:

```tsx
// domains/tasks/components/TaskDetail.tsx  (Server Component)
import { TaskDetailActions } from './TaskDetailActions';

export function TaskDetail({ task }: { task: Task }) {
  return (
    <div>
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      <TaskDetailActions taskId={task.id} /> {/* Client Component */}
    </div>
  );
}

// domains/tasks/components/TaskDetailActions.tsx
'use client';
export function TaskDetailActions({ taskId }: { taskId: string }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setEditOpen(true)}>Edit</Button>
      {editOpen && <TaskForm taskId={taskId} onClose={() => setEditOpen(false)} />}
    </>
  );
}
```

Domain components never import from sibling domains.

### Tier 3 — `app/` Pages (Composition Layer)

Pages have one job: fetch data and compose domain components into a layout. No local state, no hooks.

```tsx
// app/(dashboard)/projects/[id]/page.tsx
import { createServerApiClient } from '@/shared/lib/api.server';
import { ProjectBoard } from '@/domains/projects/components/ProjectBoard';
import { TaskList } from '@/domains/tasks/components/TaskList';

export default async function ProjectPage({ params }) {
  const api = createServerApiClient();
  const [project, tasks] = await Promise.all([
    api.get(`/projects/${params.id}`),
    api.get(`/projects/${params.id}/tasks`),
  ]);
  return (
    <ProjectBoard project={project}>
      <TaskList tasks={tasks} />
    </ProjectBoard>
  );
}
```

### Naming conventions

| Pattern | Example | Meaning |
|---|---|---|
| `XxxForm` | `TaskForm` | Creates or edits an entity |
| `XxxCard` | `TaskCard` | Compact display in a list |
| `XxxDetail` | `TaskDetail` | Full view of a single entity |
| `XxxList` | `TaskList` | Renders a collection |
| `XxxBoard` | `ProjectBoard` | Layout/container for a domain view |
| `XxxActions` | `TaskDetailActions` | Client Component holding interactive controls for a Server Component parent |

---

## Section 5 — Error Handling & Data Flow

### Data flow

```
URL change
  → Next.js App Router
    → Server Component (page.tsx)
      → fetch data via api.server.ts (createServerApiClient)
        → render domain components with data as props
          → Client Components hydrate
            → React Query takes over for mutations & invalidation
              → Zustand updates UI state
```

One-way, top-down. No component reaches sideways to fetch data a parent already has.

### Error boundaries — file-based (App Router)

```
app/
├── not-found.tsx              ← root-level 404, covers (auth) and all unmatched routes
└── (dashboard)/
    ├── error.tsx              ← catches unhandled errors in this route segment
    ├── not-found.tsx          ← 404 for dashboard routes
    └── projects/
        └── error.tsx          ← catches errors scoped to /projects only
```

Auth route group (`(auth)`) does not have its own `error.tsx` or `not-found.tsx` — it falls through to the root-level files.

### React Query error handling — domain level

```ts
const { data, error, isLoading } = useTasksQuery(projectId);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage message={error.message} />;
```

React Query catches `ApiError` from the `api-client` package and exposes it typed. No `try/catch` in components.

### Global error handling — one place

```ts
// shared/lib/queryClient.ts
// Export a factory, not a singleton — instantiated per browser session in Providers.tsx.
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@task-management/api-client';

export function makeQueryClient() {
  return new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          // redirect to login globally
          window.location.href = '/login';
        }
      },
    },
  });
}
```

401 (unauthorized) is caught globally — not handled per mutation.

### Loading state conventions

| Situation | Pattern |
|---|---|
| Initial page data | `loading.tsx` in App Router + Suspense boundary |
| Mutation in progress | `isPending` from `useMutation` → disable button + spinner |
| Background refetch | React Query handles silently, no UI needed |

---

## Out of Scope

- Real-time (WebSocket / SSE) — deferred to a future spec
- File attachments — deferred
- Notifications — deferred
- React Native / mobile — covered by the `api-client` package design
- React Query `prefetchQuery` / `dehydrate` / `HydrationBoundary` — deferred; pages pass server-fetched data as props for now
