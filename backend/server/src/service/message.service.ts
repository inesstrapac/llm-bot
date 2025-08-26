// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/message.entity';
import { ConversationService } from './conversation.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly conversationService: ConversationService,
  ) {}

  findAllByConversationId(conversationId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
    });
  }

  async create(message: Partial<Message>, userId: number) {
    if (message.conversation?.id == null) {
      let conversation = await this.conversationService.create({
        name: 'New conversation', //TODO UPDATE THIS SO NAME IS PROPERLY SET
        user: { id: userId } as any,
        dateCreated: new Date(),
      });
      message.conversation = conversation;
    }
    return this.messageRepository.save(this.messageRepository.create(message));
  }
}
