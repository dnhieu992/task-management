# Task Management Feature Design

**Date:** 2026-03-26
**Status:** Approved

## Overview

Implement the core task management feature: authentication, project-based groups with member management, and task assignment with visibility rules. Users create projects, invite members, and create tasks assigned to members. Users only see tasks assigned to them — not tasks they created.

## Authentication

### Strategy

JWT with httpOnly cookies. Aligns with the existing frontend setup (`api.server.ts` reads cookies per-request, `api.client.ts` sends cookies automatically).

### Registration

- `POST /api/auth/register` — accepts `{ email, password, name }`
- Password hashed with **bcrypt** before storing
- Returns JWT in httpOnly cookie + user profile in response body

### Login

- `POST /api/auth/login` — accepts `{ email, password }`
- Validates credentials with bcrypt compare
- Returns JWT in httpOnly cookie + user profile in response body

### Auth Guard

- `JwtAuthGuard` extracts JWT from the cookie, validates it, attaches user to `request.user`
- Applied globally to all routes except `/auth/login` and `/auth/register` (marked with `@Public()` decorator)
- JWT payload: `{ sub: userId, email: string }`

### Dependencies

`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`

## Data Model

### Modified: Task Entity

- Add `creatorId` (UUID, required) — FK to `users.id`
- Add `creator` relation (ManyToOne → User)
- Constrain `status` to enum: `'todo' | 'inprogress' | 'done'`

### New: ProjectMember Entity

| Column      | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| `id`        | UUID      | PK                             |
| `projectId` | UUID      | FK → projects.id               |
| `userId`    | UUID      | FK → users.id                  |
| `role`      | VARCHAR   | `'owner'` or `'member'`        |
| `createdAt` | TIMESTAMP | When joined                    |

- Unique constraint on `(projectId, userId)` — no duplicate memberships
- When a user creates a project, they are automatically added as a `ProjectMember` with role `'owner'`

### Relationships

```
User ──< ProjectMember >── Project
                              │
                              ├──< Task (projectId)
                              │      ├── creator (creatorId → User)
                              │      └── assignee (assigneeId → User)
```

### Visibility Rule

- `GET /api/tasks` returns only tasks where `assigneeId = currentUser.id`
- If a user assigns a task to themselves, they will see it (the filter is purely `assigneeId = currentUser`)
- There is no explicit exclusion of self-created tasks; the natural behavior is that creators typically assign tasks to others

## API Endpoints

### Auth

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| `POST` | `/api/auth/register`  | Create account       |
| `POST` | `/api/auth/login`     | Login, get JWT cookie|

### Projects

| Method   | Endpoint              | Description                                      |
|----------|-----------------------|--------------------------------------------------|
| `POST`   | `/api/projects`       | Create project (caller becomes owner + member)   |
| `GET`    | `/api/projects`       | List projects where current user is a member     |
| `GET`    | `/api/projects/:id`   | Get project detail (members only)                |
| `PATCH`  | `/api/projects/:id`   | Update project (owner only)                      |
| `DELETE` | `/api/projects/:id`   | Delete project (owner only)                      |

### Project Members

| Method   | Endpoint                            | Description                        |
|----------|-------------------------------------|------------------------------------|
| `POST`   | `/api/projects/:id/members`         | Add member by email (owner only)   |
| `GET`    | `/api/projects/:id/members`         | List members (any member can view) |
| `DELETE`  | `/api/projects/:id/members/:userId` | Remove member (owner only)         |

### Tasks

| Method   | Endpoint                      | Description                                                          |
|----------|-------------------------------|----------------------------------------------------------------------|
| `POST`   | `/api/projects/:id/tasks`     | Create task in project (any member, `creatorId` set automatically)   |
| `GET`    | `/api/tasks`                  | List tasks assigned to current user (across all projects)            |
| `GET`    | `/api/projects/:id/tasks`     | List tasks in project assigned to current user                       |
| `GET`    | `/api/tasks/:id`              | Get task detail (assignee only)                                      |
| `PATCH`  | `/api/tasks/:id`              | Update task — assignee can change status; creator can edit metadata   |
| `DELETE` | `/api/tasks/:id`              | Delete task (creator only)                                           |

### Authorization Rules

- Project endpoints gated by membership check
- Task creation requires project membership
- Task viewing filtered to `assigneeId = currentUser`
- Task status updates (todo → inprogress → done) allowed by assignee
- Task metadata edits (title, description, reassign) allowed by creator
- Task deletion allowed by creator only

## Frontend

### Pages & Navigation

**Auth pages (public):**
- `/login` — email + password form, redirects to `/projects` on success
- `/register` — email + password + name form, redirects to `/login` on success

**Dashboard pages (protected):**
- `/projects` — list of projects the user belongs to, with "Create Project" button
- `/projects/:id` — project detail: member list + task list view
- `/tasks` — global "My Tasks" view: all tasks assigned to current user across all projects

### Project Detail Page (`/projects/:id`)

- **Header:** project name, description. Owner sees "Manage Members" button.
- **Members section:** list of members with names. Owner sees "Add Member" button → modal with email input.
- **Tasks section:** list view table with columns: Title, Status (badge), Assignee, Due Date, Priority. "Create Task" button → modal/form with title, description, assignee dropdown (project members), status, priority, due date.

### My Tasks Page (`/tasks`)

- Same list view table but filterable by project
- User can click a task to see detail or update status

### Components

- `ProjectList` — card grid of projects
- `ProjectDetail` — header + members + tasks
- `MemberList` — avatar list with add/remove
- `AddMemberModal` — email input, submit
- `TaskListTable` — reusable table for tasks (used in project detail and my-tasks page)
- `CreateTaskModal` — form for new task
- `TaskStatusBadge` — colored badge for todo/inprogress/done

### State Management

- **React Query** for all API data (projects, members, tasks)
- **Zustand** stays as-is for UI state (sidebar, active task)

## Technical Approach

- Build on existing entity stubs (User, Project, Task) — no rewrites
- Add `ProjectMember` as the only new entity
- Add `creatorId` to existing Task entity
- Implement all service stubs that are currently TODO
- Follow existing patterns: NestJS modules, TypeORM repositories, React Query hooks
- TypeORM `synchronize: true` handles schema changes in development
