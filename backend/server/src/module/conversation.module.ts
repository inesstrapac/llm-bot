// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationController } from 'src/controller/conversation.controller';
import { Conversation } from 'src/entities/conversation.entity';
import { ConversationService } from 'src/service/conversation.service.';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  providers: [ConversationService],
  controllers: [ConversationController],
  exports: [ConversationService],
})
export class ConversationModule {}
