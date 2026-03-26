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
