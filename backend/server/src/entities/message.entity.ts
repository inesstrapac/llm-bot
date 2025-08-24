// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsNumber, IsString, IsDate, IsBoolean } from 'class-validator';
import { Conversation } from './conversation.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  isPrompt: boolean;

  @Column()
  dateCreated: Date;
}

export class CreateMessageDto {
  @IsString() content?: string;
  @IsNumber() conversationId?: number;
  @IsDate() dateCreated?: Date;
  @IsBoolean() isPrompt: boolean;
}
