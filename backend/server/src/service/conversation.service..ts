// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from 'src/entities/conversation.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  findAllByUserId(userId: number): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { user: { id: userId } },
    });
  }

  create(conversation: Partial<Conversation>) {
    return this.conversationRepository.save(
      this.conversationRepository.create(conversation),
    );
  }

  findById(conversationId: number) {
    return this.conversationRepository.findOne({
      where: { id: conversationId },
    });
  }
}
