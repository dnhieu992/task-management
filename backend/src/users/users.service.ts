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
