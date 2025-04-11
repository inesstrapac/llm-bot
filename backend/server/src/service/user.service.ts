// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>, // Inject repository for User entity
  ) {}

  // Fetch all users
  async findAll(): Promise<User[]> {
    return this.userRepository.find(); // This uses TypeORM's built-in find method
  }

  // Create a new user
  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData); // Create a new instance of User
    return this.userRepository.save(user); // Save the user to the database
  }
}
