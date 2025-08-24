// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { IsNumber, IsString, IsDate } from 'class-validator';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.conversations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  dateCreated: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}

export class CreateConversationDto {
  @IsString() name?: string;
  @IsNumber() userId?: number;
  @IsDate() dateCreated?: Date;
}
