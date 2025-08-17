// src/seeding/admin.seeder.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UserService } from 'src/service/user.service';
import { UserRole } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DevBootstrapService implements OnApplicationBootstrap {
  private readonly log = new Logger(DevBootstrapService.name);
  constructor(
    private userService: UserService,
    private readonly ds: DataSource,
  ) {}

  async onApplicationBootstrap() {
    const tables = this.ds.entityMetadatas
      .map((m) => `"${m.schema ?? 'public'}"."${m.tableName}"`)
      .join(', ');

    if (tables) {
      this.log.warn(`TRUNCATE ${tables}`);
      await this.ds.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE;`);
    }

    const passwordHash = await bcrypt.hash('admin', 12);
    await this.userService.create({
      email: 'admin',
      name: 'admin',
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: false,
    });

    this.log.log(`Seeded admin user.'}`);
  }
}
