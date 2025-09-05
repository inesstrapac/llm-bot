import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto, Message } from 'src/entities/message.entity';
import { ConversationService } from './conversation.service';
import { Conversation } from 'src/entities/conversation.entity';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly conversationService: ConversationService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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
        collectionName: message.collectionName,
      });
    } else {
      conversation = await this.conversationService.findById(
        message.conversationId,
      );
    }

    if (!message.isPrompt) {
      const aiUrl = `${this.configService.get<string>('AI_SERVICE_URL')}/ask`;
      const response$ = this.httpService.post(aiUrl, {
        question: message.content,
        collection: message.collectionName,
        k: 4,
      });
      let result = await lastValueFrom(response$);
      message.content = result.data.answer;
    }

    const newMessage: Partial<Message> = {
      content: message.content,
      conversation: conversation,
      dateCreated: new Date(),
      isPrompt: message.isPrompt,
      collectionName: message.collectionName,
    };

    return this.messageRepository.save(
      this.messageRepository.create(newMessage),
    );
  }
}
