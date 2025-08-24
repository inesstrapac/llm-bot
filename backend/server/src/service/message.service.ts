// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/Message.entity';
import { Conversation } from 'src/entities/conversation.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly MessageRepository: Repository<Message>,
    private readonly ConversationRepository: Repository<Conversation>,
  ) {}

  findAllByConversationId(conversationId: number): Promise<Message[]> {
    return this.MessageRepository.find({
      where: { conversation: { id: conversationId } },
    });
  }

  async create(message: Partial<Message>, userId: number) {
    if (message.conversation?.id == null) {
      let conversation = this.ConversationRepository.create({
        name: 'New conversation', //TODO UPDATE THIS SO NAME IS PROPERLY SET
        user: { id: userId } as any,
        dateCreated: new Date(),
      });
      conversation = await this.ConversationRepository.save(conversation);
      message.conversation = conversation;
    }
    return this.MessageRepository.save(this.MessageRepository.create(message));
  }
}
