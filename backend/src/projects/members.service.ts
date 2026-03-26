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
