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
    it('should reject non-assignee non-creator from viewing', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: 't1', assigneeId: 'u2', creatorId: 'u3' });
      await expect(service.findOne('t1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });
});
