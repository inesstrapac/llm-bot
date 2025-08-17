// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, LoginDto, RegisterDto } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  create(user: Partial<User>) {
    return this.userRepository.save(this.userRepository.create(user));
  }

  findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  updateUser(id: number, data: Partial<User>) {
    return this.userRepository.update({ id: id }, data);
  }
}
