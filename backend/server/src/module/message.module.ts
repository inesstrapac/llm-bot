import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageController } from 'src/controller/message.controller';
import { Message } from 'src/entities/message.entity';
import { MessageService } from 'src/service/message.service';
import { ConversationModule } from './conversation.module';

@Module({
  imports: [
    HttpModule,
    ConversationModule,
    TypeOrmModule.forFeature([Message]),
  ],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
