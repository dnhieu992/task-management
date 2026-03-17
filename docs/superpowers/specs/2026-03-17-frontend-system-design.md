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
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx              # redirects to /projects
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   └── [id]/page.tsx
│   │   └── tasks/
│   │       └── [id]/page.tsx
│   └── layout.tsx
│
├── domains/                      # Business domains — the core of the architecture
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm
│   │   ├── hooks/                # useLogin, useRegister, useCurrentUser
│   │   ├── store.ts              # Zustand: session UI state (if any)
│   │   ├── api.ts                # React Query hooks for auth endpoints
│   │   └── types.ts
│   ├── tasks/
│   │   ├── components/           # TaskCard, TaskList, TaskForm, TaskDetail
│   │   ├── hooks/                # useTasks, useTask, useCreateTask, etc.
│   │   ├── api.ts                # React Query: useTasksQuery, useCreateTaskMutation
│   │   └── types.ts
│   └── projects/
│       ├── components/           # ProjectCard, ProjectBoard, ProjectSidebar
│       ├── hooks/
│       ├── api.ts
│       └── types.ts
│
├── shared/                       # No domain knowledge — purely reusable
│   ├── components/               # Button, Input, Modal, Spinner, Badge, Card
│   ├── hooks/                    # useDebounce, useLocalStorage, usePagination
│   ├── lib/                      # queryClient.ts, api instance
│   └── types/                    # Pagination, ApiResponse, etc.
│
└── store/                        # Global Zustand store
    ├── ui.ts                     # sidebar open, active modal, active task
    └── index.ts                  # combine and export slices
```

**Boundary rule:** A domain may import from `shared/` but never from another domain. Cross-domain communication happens through the Zustand store or URL state. Pages in `app/` are the only place where domain components are composed together.

---

## Section 2 — Rendering Architecture

**Default: Server Components.** Every file is a Server Component unless it explicitly opts in with `'use client'`.

A component becomes a Client Component when it needs:
- `useState` or `useReducer`
- `useEffect`
- Event handlers (`onClick`, `onChange`, etc.)
- React Query hooks (which rely on context)
- Zustand store access

### Rendering layers

```
app/(dashboard)/projects/[id]/page.tsx     ← Server Component
│   Fetches project data via api-client (async/await)
│   Passes data as props to domain components
│
├── domains/projects/components/ProjectBoard.tsx   ← Server Component
│   Renders layout, receives task list as props
│
├── domains/tasks/components/TaskList.tsx          ← Server Component
│   Maps tasks → TaskCard
│
└── domains/tasks/components/TaskCard.tsx          ← Client Component ('use client')
    Needs onClick, hover state, drag interactions
```

### Data fetching strategy

| Layer | Who fetches | How |
|---|---|---|
| Page (`app/`) | Server Component | `async/await` with `api-client` directly |
| Mutations | Client Component | React Query `useMutation` |
| Real-time / optimistic UI | Client Component | React Query `useQuery` with invalidation |
| Global UI state | Client Component | Zustand store |

Server Components eliminate client-side data waterfalls. Pages arrive with initial data pre-rendered. Client Components handle interactivity after hydration.

---

## Section 3 — State Management

Two tools with strictly separated responsibilities.

### React Query — server state

All data that originates from or is persisted to the API goes through React Query.

```ts
// domains/tasks/api.ts
export const useTasksQuery = (projectId: string) =>
  useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.getTasks(projectId),
  });

export const useCreateTaskMutation = () =>
  useMutation({
    mutationFn: api.createTask,
    onSuccess: (_, { projectId }) =>
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
```

Query keys are cache identifiers — treat them as a contract. Invalidating `['tasks', projectId]` triggers a refetch everywhere that key is used.

### Zustand — UI state

Only state with no server equivalent lives in Zustand.

```ts
// store/ui.ts
interface UIStore {
  sidebarOpen: boolean;
  activeTaskId: string | null;
  toggleSidebar: () => void;
  setActiveTask: (id: string | null) => void;
}
```

### Decision rule

| Question | Use |
|---|---|
| Does this data come from or go to the API? | React Query |
| Would refreshing the page reset this state? | Zustand |
| Is this a loading/error state for a request? | React Query (built-in) |
| Is this UI-only (open/closed, selected)? | Zustand |

### Auth

The session token is stored in an httpOnly cookie managed by the server. `useCurrentUser` is a React Query hook — the user object comes from the API. Zustand does not store auth data.

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
├── TaskCard.tsx      # 'use client' — clickable, shows badge, title, assignee
├── TaskList.tsx      # Server Component — maps tasks → TaskCard
├── TaskForm.tsx      # 'use client' — form with validation, calls useMutation
└── TaskDetail.tsx    # Server Component — full task view, edit opens TaskForm modal
```

`TaskDetail` is a Server Component. Editing is triggered by a button that opens `TaskForm` as a Client Component modal — this keeps the expensive render on the server and limits the client bundle to interactive parts only.

Domain components never import from sibling domains.

### Tier 3 — `app/` Pages (Composition Layer)

Pages have one job: compose domain components into a layout. No logic, no state, no hooks.

```tsx
// app/(dashboard)/projects/[id]/page.tsx
export default async function ProjectPage({ params }) {
  const project = await fetchProject(params.id);
  return (
    <ProjectBoard project={project}>
      <TaskList projectId={params.id} />
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

---

## Section 5 — Error Handling & Data Flow

### Data flow

```
URL change
  → Next.js App Router
    → Server Component (page.tsx)
      → fetch data via api-client
        → render domain components with data as props
          → Client Components hydrate
            → React Query takes over for mutations & refetches
              → Zustand updates UI state
```

One-way, top-down. No component reaches sideways to fetch data a parent already has.

### Error boundaries — file-based (App Router)

```
app/(dashboard)/
├── error.tsx          ← catches unhandled errors in this route segment
├── not-found.tsx      ← 404 for this segment
└── projects/
    ├── error.tsx      ← catches errors scoped to /projects only
```

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
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          // redirect to login globally
        }
      },
    },
  },
});
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
