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
