# Task Management Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement authentication, project membership, and task management with visibility rules — users only see tasks assigned to them.

**Architecture:** NestJS backend with JWT auth (httpOnly cookies), TypeORM entities (User, Project, Task, ProjectMember), and Next.js 14 frontend with React Query + MUI. The backend enforces all authorization rules; the frontend consumes the API.

**Tech Stack:** NestJS 10, TypeORM 0.3, MySQL, JWT (passport-jwt), bcrypt, Next.js 14 (App Router), React Query v5, MUI 6, Zustand 4

**Spec:** `docs/superpowers/specs/2026-03-26-task-management-feature-design.md`

---

## File Structure

### Backend — New Files
- `backend/src/auth/strategies/jwt.strategy.ts` — Passport JWT strategy (extracts from cookie)
- `backend/src/auth/dto/login.dto.ts` — Login DTO
- `backend/src/auth/dto/register.dto.ts` — Register DTO
- `backend/src/common/decorators/public.decorator.ts` — @Public() decorator
- `backend/src/common/decorators/current-user.decorator.ts` — @CurrentUser() param decorator
- `backend/src/common/guards/jwt-auth.guard.ts` — Global JWT auth guard
- `backend/src/projects/entities/project-member.entity.ts` — ProjectMember join table
- `backend/src/projects/dto/create-project.dto.ts` — Create project DTO
- `backend/src/projects/dto/update-project.dto.ts` — Update project DTO
- `backend/src/projects/dto/add-member.dto.ts` — Add member DTO
- `backend/src/projects/members.controller.ts` — Project members sub-controller
- `backend/src/projects/members.service.ts` — Membership logic
- `backend/src/tasks/dto/create-task.dto.ts` — Create task DTO
- `backend/src/tasks/dto/update-task.dto.ts` — Update task DTO

### Backend — Modified Files
- `backend/src/auth/auth.module.ts` — Add JWT, Passport, UsersModule imports
- `backend/src/auth/auth.controller.ts` — Implement login/register with cookie response
- `backend/src/auth/auth.service.ts` — Implement JWT + bcrypt logic
- `backend/src/users/users.service.ts` — Implement findByEmail, findOne
- `backend/src/users/users.controller.ts` — Use @CurrentUser decorator
- `backend/src/users/entities/user.entity.ts` — Add createdTasks relation
- `backend/src/projects/entities/project.entity.ts` — Add members relation
- `backend/src/projects/projects.module.ts` — Add ProjectMember entity, UsersModule import
- `backend/src/projects/projects.controller.ts` — Implement with auth + membership checks
- `backend/src/projects/projects.service.ts` — Implement CRUD with membership
- `backend/src/tasks/entities/task.entity.ts` — Add creatorId, creator relation, constrain status
- `backend/src/tasks/tasks.module.ts` — Add ProjectMember dependency
- `backend/src/tasks/tasks.controller.ts` — Implement with auth + visibility rules
- `backend/src/tasks/tasks.service.ts` — Implement CRUD with visibility filtering
- `backend/src/app.module.ts` — Add global JWT guard
- `backend/src/main.ts` — Add cookie-parser, ValidationPipe

### Backend — Test Files
- `backend/src/auth/auth.service.spec.ts`
- `backend/src/auth/auth.controller.spec.ts`
- `backend/src/users/users.service.spec.ts`
- `backend/src/projects/projects.service.spec.ts`
- `backend/src/projects/members.service.spec.ts`
- `backend/src/tasks/tasks.service.spec.ts`

### Frontend — New Files
- `frontend/src/shared/types/index.ts` — Shared TypeScript interfaces (User, Project, Task, etc.)
- `frontend/src/features/auth/api.ts` — Auth API calls (login, register)
- `frontend/src/features/auth/hooks.ts` — useLogin, useRegister mutations
- `frontend/src/features/auth/components/LoginForm.tsx` — Login form component
- `frontend/src/features/auth/components/RegisterForm.tsx` — Register form component
- `frontend/src/features/projects/api.ts` — Projects API calls
- `frontend/src/features/projects/hooks.ts` — React Query hooks for projects
- `frontend/src/features/projects/components/ProjectList.tsx` — Card grid
- `frontend/src/features/projects/components/ProjectDetail.tsx` — Detail view
- `frontend/src/features/projects/components/CreateProjectModal.tsx` — Create form
- `frontend/src/features/projects/components/MemberList.tsx` — Member list + add/remove
- `frontend/src/features/projects/components/AddMemberModal.tsx` — Email input modal
- `frontend/src/features/tasks/api.ts` — Tasks API calls
- `frontend/src/features/tasks/hooks.ts` — React Query hooks for tasks
- `frontend/src/features/tasks/components/TaskListTable.tsx` — Reusable task table
- `frontend/src/features/tasks/components/CreateTaskModal.tsx` — Create task form
- `frontend/src/features/tasks/components/TaskStatusBadge.tsx` — Status badge

### Frontend — Modified Files
- `frontend/src/app/(auth)/login/page.tsx` — Render LoginForm
- `frontend/src/app/(auth)/register/page.tsx` — Render RegisterForm
- `frontend/src/app/(dashboard)/layout.tsx` — Add sidebar navigation
- `frontend/src/app/(dashboard)/projects/page.tsx` — Render ProjectList
- `frontend/src/app/(dashboard)/projects/[id]/page.tsx` — Render ProjectDetail
- `frontend/src/app/(dashboard)/tasks/[id]/page.tsx` — Render task detail
- `frontend/src/app/(dashboard)/tasks/page.tsx` — New: My Tasks page

---

## Task 1: Install Backend Dependencies

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install auth dependencies**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management && npm install --prefix backend @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt cookie-parser class-validator class-transformer
```

- [ ] **Step 2: Install dev type dependencies**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management && npm install --prefix backend -D @types/passport-jwt @types/bcrypt @types/cookie-parser
```

- [ ] **Step 3: Verify installation**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx nest build
```
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: install auth, validation, and cookie dependencies"
```

---

## Task 2: Auth Infrastructure — Decorators, Guards, JWT Strategy

**Files:**
- Create: `backend/src/common/decorators/public.decorator.ts`
- Create: `backend/src/common/decorators/current-user.decorator.ts`
- Create: `backend/src/common/guards/jwt-auth.guard.ts`
- Create: `backend/src/auth/strategies/jwt.strategy.ts`
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Create @Public() decorator**

```typescript
// backend/src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Create @CurrentUser() param decorator**

```typescript
// backend/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 3: Create JwtAuthGuard (global, respects @Public)**

```typescript
// backend/src/common/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

- [ ] **Step 4: Create JWT strategy (reads from cookie)**

```typescript
// backend/src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';

function extractJwtFromCookie(req: Request): string | null {
  return req?.cookies?.['auth-token'] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret-change-me'),
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

- [ ] **Step 5: Update main.ts — add cookie-parser and ValidationPipe**

Modify `backend/src/main.ts` to:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
```

- [ ] **Step 6: Verify build**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx nest build
```
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add backend/src/common/ backend/src/auth/strategies/ backend/src/main.ts
git commit -m "feat: add JWT strategy, auth guard, and decorators"
```

---

## Task 3: Auth Module — Register & Login

**Files:**
- Create: `backend/src/auth/dto/register.dto.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Modify: `backend/src/auth/auth.module.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/users/users.service.ts`
- Modify: `backend/src/users/entities/user.entity.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// backend/src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  name: string;
}
```

```typescript
// backend/src/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

- [ ] **Step 2: Implement UsersService (findByEmail, findOne, create)**

Replace `backend/src/users/users.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findOne(id: string) {
    return this.usersRepo.findOne({ where: { id }, select: ['id', 'email', 'name', 'createdAt', 'updatedAt'] });
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  create(data: { email: string; password: string; name: string }) {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }
}
```

- [ ] **Step 3: Add createdTasks relation to User entity**

Add to `backend/src/users/entities/user.entity.ts` after the `assignedTasks` relation:

```typescript
@OneToMany(() => Task, (task) => task.creator)
createdTasks: Task[];
```

- [ ] **Step 4: Implement AuthService**

Replace `backend/src/auth/auth.service.ts`:

```typescript
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
```

- [ ] **Step 5: Implement AuthController (set httpOnly cookie)**

Replace `backend/src/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    return result.user;
  }
}
```

- [ ] **Step 6: Update AuthModule — import JWT, Passport, UsersModule**

Replace `backend/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 7: Register global JWT guard in AppModule**

Modify `backend/src/app.module.ts` — add to providers array:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
```

Add to the `providers` array:

```typescript
providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
```

- [ ] **Step 8: Update UsersController to use @CurrentUser**

Replace `backend/src/users/users.controller.ts`:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: { id: string; email: string }) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

- [ ] **Step 9: Write auth service tests**

Create `backend/src/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Test' });

      const result = await authService.register({ email: 'a@b.com', password: 'pass123', name: 'Test' });

      expect(result).toEqual({ id: '1', email: 'a@b.com', name: 'Test' });
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: expect.any(String),
        name: 'Test',
      });
      // Verify password was hashed (not plaintext)
      const savedPassword = usersService.create.mock.calls[0][0].password;
      expect(savedPassword).not.toBe('pass123');
      expect(await bcrypt.compare('pass123', savedPassword)).toBe(true);
    });

    it('should throw ConflictException if email exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1' });
      await expect(authService.register({ email: 'a@b.com', password: 'pass123', name: 'Test' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return token and user on valid credentials', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Test', password: hashed });

      const result = await authService.login({ email: 'a@b.com', password: 'pass123' });

      expect(result.token).toBe('mock-token');
      expect(result.user).toEqual({ id: '1', email: 'a@b.com', name: 'Test' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: '1', email: 'a@b.com' });
    });

    it('should throw UnauthorizedException for wrong email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(authService.login({ email: 'a@b.com', password: 'pass123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com', password: hashed });
      await expect(authService.login({ email: 'a@b.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 10: Run tests**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx jest src/auth/auth.service.spec.ts --verbose
```
Expected: All 4 tests pass

- [ ] **Step 11: Commit**

```bash
git add backend/src/auth/ backend/src/users/ backend/src/common/ backend/src/app.module.ts backend/src/main.ts
git commit -m "feat: implement JWT auth with register, login, and global guard"
```

---

## Task 4: ProjectMember Entity & Task Entity Updates

**Files:**
- Create: `backend/src/projects/entities/project-member.entity.ts`
- Modify: `backend/src/projects/entities/project.entity.ts`
- Modify: `backend/src/tasks/entities/task.entity.ts`

- [ ] **Step 1: Create ProjectMember entity**

```typescript
// backend/src/projects/entities/project-member.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: 'member' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 2: Add members relation to Project entity**

Add to `backend/src/projects/entities/project.entity.ts` after the `tasks` relation import and add the import:

```typescript
import { ProjectMember } from './project-member.entity';
```

Add after the `tasks` field:

```typescript
@OneToMany(() => ProjectMember, (member) => member.project)
members: ProjectMember[];
```

- [ ] **Step 3: Add creatorId and creator relation to Task entity**

Modify `backend/src/tasks/entities/task.entity.ts`:

Add `onDelete: 'CASCADE'` to the existing project relation so tasks are cascade-deleted when a project is removed:

```typescript
@ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
```

Add after the `assigneeId` column:

```typescript
@ManyToOne(() => User, (user) => user.createdTasks)
@JoinColumn({ name: 'creator_id' })
creator: User;

@Column({ name: 'creator_id' })
creatorId: string;
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx nest build
```
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add backend/src/projects/entities/ backend/src/tasks/entities/ backend/src/users/entities/
git commit -m "feat: add ProjectMember entity and Task.creatorId"
```

---

## Task 5: Projects Service & Controller (CRUD + Membership)

**Files:**
- Create: `backend/src/projects/dto/create-project.dto.ts`
- Create: `backend/src/projects/dto/update-project.dto.ts`
- Create: `backend/src/projects/dto/add-member.dto.ts`
- Create: `backend/src/projects/members.controller.ts`
- Create: `backend/src/projects/members.service.ts`
- Modify: `backend/src/projects/projects.service.ts`
- Modify: `backend/src/projects/projects.controller.ts`
- Modify: `backend/src/projects/projects.module.ts`
- Test: `backend/src/projects/projects.service.spec.ts`
- Test: `backend/src/projects/members.service.spec.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// backend/src/projects/dto/create-project.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

```typescript
// backend/src/projects/dto/update-project.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```

```typescript
// backend/src/projects/dto/add-member.dto.ts
import { IsEmail } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email: string;
}
```

- [ ] **Step 2: Implement ProjectsService**

Replace `backend/src/projects/projects.service.ts`:

```typescript
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
  ) {}

  async findAll(userId: string) {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: ['project'],
    });
    return memberships.map((m) => m.project);
  }

  async findOne(id: string, userId: string) {
    const project = await this.projectsRepo.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!project) throw new NotFoundException('Project not found');
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member of this project');
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const project = this.projectsRepo.create({ ...dto, ownerId: userId });
    const saved = await this.projectsRepo.save(project);
    const membership = this.membersRepo.create({
      projectId: saved.id,
      userId,
      role: 'owner',
    });
    await this.membersRepo.save(membership);
    return saved;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only the owner can update this project');
    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  async remove(id: string, userId: string) {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only the owner can delete this project');
    await this.projectsRepo.remove(project);
  }
}
```

- [ ] **Step 3: Implement MembersService**

```typescript
// backend/src/projects/members.service.ts
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    private readonly usersService: UsersService,
  ) {}

  async addMember(projectId: string, email: string, currentUserId: string) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== currentUserId) throw new ForbiddenException('Only the owner can add members');

    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.membersRepo.findOne({ where: { projectId, userId: user.id } });
    if (existing) throw new ConflictException('User is already a member');

    const member = this.membersRepo.create({ projectId, userId: user.id, role: 'member' });
    return this.membersRepo.save(member);
  }

  async getMembers(projectId: string, currentUserId: string) {
    const isMember = await this.membersRepo.findOne({ where: { projectId, userId: currentUserId } });
    if (!isMember) throw new ForbiddenException('Not a member of this project');
    return this.membersRepo.find({ where: { projectId }, relations: ['user'] });
  }

  async removeMember(projectId: string, userId: string, currentUserId: string) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== currentUserId) throw new ForbiddenException('Only the owner can remove members');
    if (userId === currentUserId) throw new ForbiddenException('Cannot remove yourself as owner');

    const member = await this.membersRepo.findOne({ where: { projectId, userId } });
    if (!member) throw new NotFoundException('Member not found');
    await this.membersRepo.remove(member);
  }
}
```

- [ ] **Step 4: Implement ProjectsController**

Replace `backend/src/projects/projects.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.projectsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.projectsService.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: { id: string }) {
    return this.projectsService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: { id: string }) {
    return this.projectsService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.projectsService.remove(id, user.id);
  }
}
```

- [ ] **Step 5: Implement MembersController**

```typescript
// backend/src/projects/members.controller.ts
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { MembersService } from './members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects/:projectId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  getMembers(@Param('projectId') projectId: string, @CurrentUser() user: { id: string }) {
    return this.membersService.getMembers(projectId, user.id);
  }

  @Post()
  addMember(
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.membersService.addMember(projectId, dto.email, user.id);
  }

  @Delete(':userId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.membersService.removeMember(projectId, userId, user.id);
  }
}
```

- [ ] **Step 6: Update ProjectsModule**

Replace `backend/src/projects/projects.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember]), UsersModule],
  controllers: [ProjectsController, MembersController],
  providers: [ProjectsService, MembersService],
  exports: [ProjectsService, MembersService],
})
export class ProjectsModule {}
```

- [ ] **Step 7: Write projects service tests**

Create `backend/src/projects/projects.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepo: Record<string, jest.Mock>;
  let membersRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    projectsRepo = {
      findOne: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => ({ id: 'p1', ...d })),
      remove: jest.fn(),
    };
    membersRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => d),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: projectsRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: membersRepo },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('should create project and add owner as member', async () => {
      const result = await service.create({ name: 'Test' }, 'user1');
      expect(result).toEqual(expect.objectContaining({ name: 'Test', ownerId: 'user1' }));
      expect(membersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1', role: 'owner' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return projects where user is a member', async () => {
      membersRepo.find.mockResolvedValue([
        { project: { id: 'p1', name: 'A' } },
        { project: { id: 'p2', name: 'B' } },
      ]);
      const result = await service.findAll('user1');
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if not owner', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: 'p1', ownerId: 'other' });
      await expect(service.update('p1', { name: 'New' }, 'user1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if project not found', async () => {
      projectsRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('p1', 'user1')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 8: Write members service tests**

Create `backend/src/projects/members.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { MembersService } from './members.service';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { UsersService } from '../users/users.service';

describe('MembersService', () => {
  let service: MembersService;
  let projectsRepo: Record<string, jest.Mock>;
  let membersRepo: Record<string, jest.Mock>;
  let usersService: Record<string, jest.Mock>;

  beforeEach(async () => {
    projectsRepo = { findOne: jest.fn() };
    membersRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => d),
      remove: jest.fn(),
    };
    usersService = { findByEmail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: getRepositoryToken(Project), useValue: projectsRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: membersRepo },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  describe('addMember', () => {
    it('should add a user as member', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });
      usersService.findByEmail.mockResolvedValue({ id: 'user2' });
      membersRepo.findOne.mockResolvedValue(null);

      const result = await service.addMember('p1', 'user2@test.com', 'owner1');
      expect(result).toEqual(expect.objectContaining({ projectId: 'p1', userId: 'user2' }));
    });

    it('should throw ForbiddenException if not owner', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: 'p1', ownerId: 'other' });
      await expect(service.addMember('p1', 'a@b.com', 'user1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already a member', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });
      usersService.findByEmail.mockResolvedValue({ id: 'user2' });
      membersRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.addMember('p1', 'user2@test.com', 'owner1'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('should not allow owner to remove themselves', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: 'p1', ownerId: 'owner1' });
      await expect(service.removeMember('p1', 'owner1', 'owner1'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
```

- [ ] **Step 9: Run tests**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx jest src/projects/ --verbose
```
Expected: All tests pass

- [ ] **Step 10: Verify build**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx nest build
```
Expected: Build succeeds

- [ ] **Step 11: Commit**

```bash
git add backend/src/projects/
git commit -m "feat: implement projects CRUD and member management"
```

---

## Task 6: Tasks Service & Controller (CRUD + Visibility)

**Files:**
- Create: `backend/src/tasks/dto/create-task.dto.ts`
- Create: `backend/src/tasks/dto/update-task.dto.ts`
- Modify: `backend/src/tasks/tasks.service.ts`
- Modify: `backend/src/tasks/tasks.controller.ts`
- Modify: `backend/src/tasks/tasks.module.ts`
- Test: `backend/src/tasks/tasks.service.spec.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// backend/src/tasks/dto/create-task.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsIn, IsUUID, IsDateString } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'inprogress', 'done'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
```

```typescript
// backend/src/tasks/dto/update-task.dto.ts
import { IsOptional, IsString, IsIn, IsUUID, IsDateString } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'inprogress', 'done'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
```

- [ ] **Step 2: Implement TasksService**

Replace `backend/src/tasks/tasks.service.ts`:

```typescript
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
  ) {}

  async findAllForUser(userId: string) {
    return this.tasksRepo.find({
      where: { assigneeId: userId },
      relations: ['project', 'assignee', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProject(projectId: string, userId: string) {
    const isMember = await this.membersRepo.findOne({ where: { projectId, userId } });
    if (!isMember) throw new ForbiddenException('Not a member of this project');
    return this.tasksRepo.find({
      where: { projectId, assigneeId: userId },
      relations: ['assignee', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.tasksRepo.findOne({
      where: { id },
      relations: ['project', 'assignee', 'creator'],
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.assigneeId !== userId && task.creatorId !== userId) {
      throw new ForbiddenException('You can only view tasks assigned to you or created by you');
    }
    return task;
  }

  async create(projectId: string, dto: CreateTaskDto, creatorId: string) {
    const isMember = await this.membersRepo.findOne({ where: { projectId, userId: creatorId } });
    if (!isMember) throw new ForbiddenException('Not a member of this project');

    if (dto.assigneeId) {
      const assigneeMember = await this.membersRepo.findOne({ where: { projectId, userId: dto.assigneeId } });
      if (!assigneeMember) throw new ForbiddenException('Assignee is not a member of this project');
    }

    const task = this.tasksRepo.create({ ...dto, projectId, creatorId });
    return this.tasksRepo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const task = await this.tasksRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const isAssignee = task.assigneeId === userId;
    const isCreator = task.creatorId === userId;

    if (!isAssignee && !isCreator) {
      throw new ForbiddenException('Only the assignee or creator can update this task');
    }

    // Assignee can only change status
    if (isAssignee && !isCreator) {
      const { status, ...rest } = dto;
      if (Object.keys(rest).length > 0) {
        throw new ForbiddenException('Assignees can only update task status');
      }
      if (status) task.status = status;
    } else {
      // Creator (or both) can update anything
      Object.assign(task, dto);
    }

    return this.tasksRepo.save(task);
  }

  async remove(id: string, userId: string) {
    const task = await this.tasksRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.creatorId !== userId) throw new ForbiddenException('Only the creator can delete this task');
    await this.tasksRepo.remove(task);
  }
}
```

- [ ] **Step 3: Implement TasksController**

Replace `backend/src/tasks/tasks.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks')
  findAllForUser(@CurrentUser() user: { id: string }) {
    return this.tasksService.findAllForUser(user.id);
  }

  @Get('projects/:projectId/tasks')
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.findByProject(projectId, user.id);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.tasksService.findOne(id, user.id);
  }

  @Post('projects/:projectId/tasks')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.create(projectId, dto, user.id);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: { id: string }) {
    return this.tasksService.update(id, dto, user.id);
  }

  @Delete('tasks/:id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.tasksService.remove(id, user.id);
  }
}
```

- [ ] **Step 4: Update TasksModule**

Replace `backend/src/tasks/tasks.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, ProjectMember])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
```

- [ ] **Step 5: Write tasks service tests**

Create `backend/src/tasks/tasks.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: Record<string, jest.Mock>;
  let membersRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    tasksRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => ({ id: 't1', ...d })),
      remove: jest.fn(),
    };
    membersRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: membersRepo },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('findAllForUser', () => {
    it('should return tasks assigned to the user', async () => {
      tasksRepo.find.mockResolvedValue([{ id: 't1', assigneeId: 'u1' }]);
      const result = await service.findAllForUser('u1');
      expect(tasksRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { assigneeId: 'u1' } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a task if user is a project member', async () => {
      membersRepo.findOne.mockResolvedValue({ id: 'm1' });
      const result = await service.create('p1', { title: 'Test task' }, 'u1');
      expect(result).toEqual(expect.objectContaining({ title: 'Test task', projectId: 'p1', creatorId: 'u1' }));
    });

    it('should throw ForbiddenException if not a member', async () => {
      membersRepo.findOne.mockResolvedValue(null);
      await expect(service.create('p1', { title: 'Test' }, 'u1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if assignee is not a member', async () => {
      membersRepo.findOne
        .mockResolvedValueOnce({ id: 'm1' }) // creator is member
        .mockResolvedValueOnce(null); // assignee is not member
      await expect(service.create('p1', { title: 'Test', assigneeId: 'u2' }, 'u1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should allow assignee to update status only', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: 't1', assigneeId: 'u1', creatorId: 'u2', status: 'todo' });
      const result = await service.update('t1', { status: 'inprogress' }, 'u1');
      expect(result).toEqual(expect.objectContaining({ status: 'inprogress' }));
    });

    it('should reject assignee updating title', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: 't1', assigneeId: 'u1', creatorId: 'u2' });
      await expect(service.update('t1', { title: 'New title' }, 'u1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow creator to update anything', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: 't1', assigneeId: 'u1', creatorId: 'u2', title: 'Old' });
      const result = await service.update('t1', { title: 'New', status: 'done' }, 'u2');
      expect(result).toEqual(expect.objectContaining({ title: 'New', status: 'done' }));
    });
  });

  describe('remove', () => {
    it('should allow creator to delete', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: 't1', creatorId: 'u1' });
      await service.remove('t1', 'u1');
      expect(tasksRepo.remove).toHaveBeenCalled();
    });

    it('should reject non-creator from deleting', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: 't1', creatorId: 'u2' });
      await expect(service.remove('t1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should reject non-assignee from viewing', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: 't1', assigneeId: 'u2' });
      await expect(service.findOne('t1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });
});
```

- [ ] **Step 6: Run all backend tests**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx jest --verbose
```
Expected: All tests pass

- [ ] **Step 7: Verify build**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx nest build
```
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add backend/src/tasks/
git commit -m "feat: implement tasks CRUD with visibility rules and authorization"
```

---

## Task 7: Frontend — Shared Types & API Layer

**Files:**
- Create: `frontend/src/shared/types/index.ts`
- Create: `frontend/src/features/auth/api.ts`
- Create: `frontend/src/features/auth/hooks.ts`
- Create: `frontend/src/features/projects/api.ts`
- Create: `frontend/src/features/projects/hooks.ts`
- Create: `frontend/src/features/tasks/api.ts`
- Create: `frontend/src/features/tasks/hooks.ts`

- [ ] **Step 1: Create shared types**

```typescript
// frontend/src/shared/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'inprogress' | 'done';
  priority: string;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  assignee?: User;
  creator?: User;
}
```

- [ ] **Step 2: Create auth API layer**

```typescript
// frontend/src/features/auth/api.ts
import { api } from '@/shared/lib/api.client';
import type { User } from '@/shared/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  login: (data: LoginPayload) => api.post<User>('/auth/login', data).then((r) => r.data),
  register: (data: RegisterPayload) => api.post<User>('/auth/register', data).then((r) => r.data),
  me: () => api.get<User>('/users/me').then((r) => r.data),
};
```

- [ ] **Step 3: Create auth hooks**

```typescript
// frontend/src/features/auth/hooks.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginPayload, RegisterPayload } from './api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.me,
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (user) => {
      qc.setQueryData(['currentUser'], user);
      router.push('/projects');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: () => router.push('/login'),
  });
}
```

- [ ] **Step 4: Create projects API layer**

```typescript
// frontend/src/features/projects/api.ts
import { api } from '@/shared/lib/api.client';
import type { Project, ProjectMember } from '@/shared/types';

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: string;
}

export interface AddMemberPayload {
  email: string;
}

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: CreateProjectPayload) => api.post<Project>('/projects', data).then((r) => r.data),
  update: (id: string, data: UpdateProjectPayload) => api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
  getMembers: (id: string) => api.get<ProjectMember[]>(`/projects/${id}/members`).then((r) => r.data),
  addMember: (id: string, data: AddMemberPayload) => api.post<ProjectMember>(`/projects/${id}/members`, data).then((r) => r.data),
  removeMember: (projectId: string, userId: string) => api.delete(`/projects/${projectId}/members/${userId}`).then((r) => r.data),
};
```

- [ ] **Step 5: Create projects hooks**

```typescript
// frontend/src/features/projects/hooks.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, CreateProjectPayload, UpdateProjectPayload, AddMemberPayload } from './api';

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ['projects', id], queryFn: () => projectsApi.get(id) });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectsApi.getMembers(projectId),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectPayload) => projectsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProjectPayload) => projectsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMemberPayload) => projectsApi.addMember(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId, 'members'] }),
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId, 'members'] }),
  });
}
```

- [ ] **Step 6: Create tasks API layer**

```typescript
// frontend/src/features/tasks/api.ts
import { api } from '@/shared/lib/api.client';
import type { Task } from '@/shared/types';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
}

export const tasksApi = {
  myTasks: () => api.get<Task[]>('/tasks').then((r) => r.data),
  byProject: (projectId: string) => api.get<Task[]>(`/projects/${projectId}/tasks`).then((r) => r.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (projectId: string, data: CreateTaskPayload) => api.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),
  update: (id: string, data: UpdateTaskPayload) => api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};
```

- [ ] **Step 7: Create tasks hooks**

```typescript
// frontend/src/features/tasks/hooks.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, CreateTaskPayload, UpdateTaskPayload } from './api';

export function useMyTasks() {
  return useQuery({ queryKey: ['tasks', 'mine'], queryFn: tasksApi.myTasks });
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => tasksApi.byProject(projectId),
  });
}

export function useTask(id: string) {
  return useQuery({ queryKey: ['tasks', id], queryFn: () => tasksApi.get(id) });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskPayload) => tasksApi.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTaskPayload & { id: string }) => tasksApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

- [ ] **Step 8: Verify frontend build**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/frontend && npx next build
```
Expected: Build succeeds (or only warns about unused exports)

- [ ] **Step 9: Commit**

```bash
git add frontend/src/shared/types/ frontend/src/features/
git commit -m "feat: add frontend types, API layers, and React Query hooks"
```

---

## Task 8: Frontend — Auth Pages (Login & Register)

**Files:**
- Create: `frontend/src/features/auth/components/LoginForm.tsx`
- Create: `frontend/src/features/auth/components/RegisterForm.tsx`
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Modify: `frontend/src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create LoginForm component**

```tsx
// frontend/src/features/auth/components/LoginForm.tsx
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
```

- [ ] **Step 2: Create RegisterForm component**

```tsx
// frontend/src/features/auth/components/RegisterForm.tsx
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
```

- [ ] **Step 3: Update login page**

Replace `frontend/src/app/(auth)/login/page.tsx`:

```tsx
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 4: Update register page**

Replace `frontend/src/app/(auth)/register/page.tsx`:

```tsx
import RegisterForm from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/auth/ frontend/src/app/\(auth\)/
git commit -m "feat: implement login and register pages"
```

---

## Task 9: Frontend — Dashboard Layout & Navigation

**Files:**
- Modify: `frontend/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Implement dashboard layout with sidebar navigation**

Replace `frontend/src/app/(dashboard)/layout.tsx`:

```tsx
'use client';

import { ReactNode } from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, IconButton } from '@mui/material';
import { Folder, Assignment, Menu as MenuIcon, Logout } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Projects', href: '/projects', icon: <Folder /> },
  { label: 'My Tasks', href: '/tasks', icon: <Assignment /> },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Task Management
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.href}
              selected={pathname.startsWith(item.href)}
              onClick={() => router.push(item.href)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/\(dashboard\)/layout.tsx
git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

## Task 10: Frontend — Projects List & Create

**Files:**
- Create: `frontend/src/features/projects/components/ProjectList.tsx`
- Create: `frontend/src/features/projects/components/CreateProjectModal.tsx`
- Modify: `frontend/src/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Create CreateProjectModal**

```tsx
// frontend/src/features/projects/components/CreateProjectModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { useCreateProject } from '../hooks';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createProject = useCreateProject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({ name, description: description || undefined }, {
      onSuccess: () => {
        setName('');
        setDescription('');
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent>
          <TextField
            label="Project Name"
            fullWidth
            required
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createProject.isPending}>
            {createProject.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create ProjectList component**

```tsx
// frontend/src/features/projects/components/ProjectList.tsx
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
```

- [ ] **Step 3: Update projects page**

Replace `frontend/src/app/(dashboard)/projects/page.tsx`:

```tsx
import ProjectList from '@/features/projects/components/ProjectList';

export default function ProjectsPage() {
  return <ProjectList />;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/projects/components/ProjectList.tsx frontend/src/features/projects/components/CreateProjectModal.tsx frontend/src/app/\(dashboard\)/projects/page.tsx
git commit -m "feat: implement projects list and create project modal"
```

---

## Task 11: Frontend — Project Detail (Members + Tasks)

**Files:**
- Create: `frontend/src/features/projects/components/MemberList.tsx`
- Create: `frontend/src/features/projects/components/AddMemberModal.tsx`
- Create: `frontend/src/features/projects/components/ProjectDetail.tsx`
- Create: `frontend/src/features/tasks/components/TaskStatusBadge.tsx`
- Create: `frontend/src/features/tasks/components/TaskListTable.tsx`
- Create: `frontend/src/features/tasks/components/CreateTaskModal.tsx`
- Modify: `frontend/src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Create TaskStatusBadge**

```tsx
// frontend/src/features/tasks/components/TaskStatusBadge.tsx
import { Chip } from '@mui/material';

const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' }> = {
  todo: { label: 'Todo', color: 'default' },
  inprogress: { label: 'In Progress', color: 'info' },
  done: { label: 'Done', color: 'success' },
};

export default function TaskStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, color: 'default' as const };
  return <Chip label={config.label} color={config.color} size="small" />;
}
```

- [ ] **Step 2: Create TaskListTable**

```tsx
// frontend/src/features/tasks/components/TaskListTable.tsx
'use client';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
} from '@mui/material';
import TaskStatusBadge from './TaskStatusBadge';
import type { Task } from '@/shared/types';

interface Props {
  tasks: Task[];
  showProject?: boolean;
}

export default function TaskListTable({ tasks, showProject = false }: Props) {
  if (tasks.length === 0) {
    return <Typography color="text.secondary">No tasks yet.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Assignee</TableCell>
            {showProject && <TableCell>Project</TableCell>}
            <TableCell>Due Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} hover>
              <TableCell>{task.title}</TableCell>
              <TableCell><TaskStatusBadge status={task.status} /></TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{task.priority}</TableCell>
              <TableCell>{task.assignee?.name ?? '—'}</TableCell>
              {showProject && <TableCell>{task.project?.name ?? '—'}</TableCell>}
              <TableCell>{task.dueDate ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

- [ ] **Step 3: Create CreateTaskModal**

```tsx
// frontend/src/features/tasks/components/CreateTaskModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem,
} from '@mui/material';
import { useCreateTask } from '../hooks';
import type { ProjectMember } from '@/shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: ProjectMember[];
}

export default function CreateTaskModal({ open, onClose, projectId, members }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const createTask = useCreateTask(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate(
      {
        title,
        description: description || undefined,
        assigneeId: assigneeId || undefined,
        priority,
        dueDate: dueDate || undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setAssigneeId('');
          setPriority('medium');
          setDueDate('');
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            required
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Assignee"
            fullWidth
            select
            margin="normal"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {members.map((m) => (
              <MenuItem key={m.userId} value={m.userId}>
                {m.user.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Priority"
            fullWidth
            select
            margin="normal"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          <TextField
            label="Due Date"
            fullWidth
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createTask.isPending}>
            {createTask.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

- [ ] **Step 4: Create AddMemberModal**

```tsx
// frontend/src/features/projects/components/AddMemberModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import { useAddMember } from '../hooks';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function AddMemberModal({ open, onClose, projectId }: Props) {
  const [email, setEmail] = useState('');
  const addMember = useAddMember(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember.mutate({ email }, {
      onSuccess: () => {
        setEmail('');
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          {addMember.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Could not add member. User may not exist or is already a member.
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={addMember.isPending}>
            {addMember.isPending ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

- [ ] **Step 5: Create MemberList component**

```tsx
// frontend/src/features/projects/components/MemberList.tsx
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
```

- [ ] **Step 6: Create ProjectDetail component**

```tsx
// frontend/src/features/projects/components/ProjectDetail.tsx
'use client';

import { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Divider } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useProject, useProjectMembers } from '../hooks';
import { useProjectTasks } from '@/features/tasks/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import MemberList from './MemberList';
import TaskListTable from '@/features/tasks/components/TaskListTable';
import CreateTaskModal from '@/features/tasks/components/CreateTaskModal';

interface Props {
  projectId: string;
}

export default function ProjectDetail({ projectId }: Props) {
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  const { data: currentUser } = useCurrentUser();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  if (projectLoading || membersLoading) return <CircularProgress />;
  if (!project) return <Typography>Project not found</Typography>;

  const isOwner = project.ownerId === currentUser?.id;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {project.name}
      </Typography>
      {project.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {project.description}
        </Typography>
      )}

      <MemberList projectId={projectId} isOwner={isOwner} />

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Tasks</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateTaskOpen(true)}>
          Create Task
        </Button>
      </Box>

      {tasksLoading ? <CircularProgress /> : <TaskListTable tasks={tasks ?? []} />}

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={projectId}
        members={members ?? []}
      />
    </Box>
  );
}
```

- [ ] **Step 7: Update project detail page**

Replace `frontend/src/app/(dashboard)/projects/[id]/page.tsx`:

```tsx
'use client';

import ProjectDetail from '@/features/projects/components/ProjectDetail';
import { useParams } from 'next/navigation';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  return <ProjectDetail projectId={params.id} />;
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/ frontend/src/app/\(dashboard\)/projects/
git commit -m "feat: implement project detail page with members and task management"
```

---

## Task 12: Frontend — My Tasks Page

**Files:**
- Create: `frontend/src/app/(dashboard)/tasks/page.tsx`
- Modify: `frontend/src/app/(dashboard)/tasks/[id]/page.tsx`

- [ ] **Step 1: Create My Tasks page**

```tsx
// frontend/src/app/(dashboard)/tasks/page.tsx
'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
import { useMyTasks } from '@/features/tasks/hooks';
import TaskListTable from '@/features/tasks/components/TaskListTable';

export default function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        My Tasks
      </Typography>
      {isLoading ? <CircularProgress /> : <TaskListTable tasks={tasks ?? []} showProject />}
    </Box>
  );
}
```

- [ ] **Step 2: Update task detail page with status update**

Replace `frontend/src/app/(dashboard)/tasks/[id]/page.tsx`:

```tsx
'use client';

import { useParams } from 'next/navigation';
import { Box, Typography, CircularProgress, MenuItem, TextField, Paper } from '@mui/material';
import { useTask, useUpdateTask } from '@/features/tasks/hooks';
import TaskStatusBadge from '@/features/tasks/components/TaskStatusBadge';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: task, isLoading } = useTask(params.id);
  const updateTask = useUpdateTask();

  if (isLoading) return <CircularProgress />;
  if (!task) return <Typography>Task not found</Typography>;

  const handleStatusChange = (newStatus: string) => {
    updateTask.mutate({ id: task.id, status: newStatus });
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        {task.title}
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {task.description && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            {task.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <TextField
              select
              size="small"
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              sx={{ display: 'block', mt: 0.5 }}
            >
              <MenuItem value="todo">Todo</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Priority</Typography>
            <Typography sx={{ textTransform: 'capitalize' }}>{task.priority}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Assignee</Typography>
            <Typography>{task.assignee?.name ?? '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Project</Typography>
            <Typography>{task.project?.name ?? '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Due Date</Typography>
            <Typography>{task.dueDate ?? '—'}</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
```

- [ ] **Step 3: Verify frontend build**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/frontend && npx next build
```
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/\(dashboard\)/tasks/
git commit -m "feat: implement My Tasks page and task detail with status update"
```

---

## Task 13: Add CORS credentials & Environment Variable

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Add JWT_SECRET to backend/.env**

Append to `backend/.env`:

```
JWT_SECRET=dev-secret-change-me
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 2: Ensure frontend sends cookies with requests**

Verify `frontend/src/shared/lib/api.client.ts` — the axios instance created by `createApiClient` needs `withCredentials: true`. Check if the `@task-management/api-client` package supports this. If not, modify the client:

Add after the `createApiClient` call in `api.client.ts`:

```typescript
api.defaults.withCredentials = true;
```

- [ ] **Step 3: Commit**

```bash
git add backend/.env frontend/src/shared/lib/api.client.ts
git commit -m "chore: add JWT secret env var and enable credentials on API client"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Run all backend tests**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx jest --verbose
```
Expected: All tests pass

- [ ] **Step 2: Build backend**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/backend && npx nest build
```
Expected: Build succeeds

- [ ] **Step 3: Build frontend**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/frontend && npx next build
```
Expected: Build succeeds

- [ ] **Step 4: Run frontend tests**

```bash
cd /Users/dnhieu92/Documents/personal/new-account/task-management/frontend && npx jest --verbose
```
Expected: All existing tests pass

- [ ] **Step 5: Fix any issues found in steps 1-4**

If any tests fail or builds break, fix the issues before proceeding.

- [ ] **Step 6: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve build and test issues"
```
