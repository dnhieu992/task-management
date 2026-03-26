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
