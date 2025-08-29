// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto, Message } from 'src/entities/message.entity';
import { ConversationService } from './conversation.service';
import { Conversation } from 'src/entities/conversation.entity';

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

  async create(message: CreateMessageDto, userId: number) {
    let conversation: Conversation;
    if (message.conversationId == null) {
      conversation = await this.conversationService.create({
        name: message.content,
        user: { id: userId } as any,
        dateCreated: new Date(),
      });
    } else {
      conversation = await this.conversationService.findById(
        message.conversationId,
      );
    }
    const newMessage: Partial<Message> = {
      content: message.content,
      conversation: conversation,
      dateCreated: new Date(),
      isPrompt: message.isPrompt,
    };
    return this.messageRepository.save(
      this.messageRepository.create(newMessage),
    );
  }
}
