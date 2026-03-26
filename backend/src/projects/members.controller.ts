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
