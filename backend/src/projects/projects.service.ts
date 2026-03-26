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
