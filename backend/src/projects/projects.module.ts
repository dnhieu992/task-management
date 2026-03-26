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
