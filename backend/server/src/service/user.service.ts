// src/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UpdateUserDto } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  findById(userId: number) {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async updateUser(userId: number, data: UpdateUserDto) {
    const updatedUser = await this.userRepository.preload({
      id: userId,
      ...data,
    });
    if (!updatedUser) throw new NotFoundException('User not found');
    const savedUser = await this.userRepository.save(updatedUser);
    return savedUser;
  }
}
