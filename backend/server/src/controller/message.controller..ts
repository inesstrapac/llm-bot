import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateMessageDto, Message } from 'src/entities/message.entity';
import { MessageService } from 'src/service/message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':conversationId')
  findAllByConversationId(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<Message[]> {
    return this.messageService.findAllByConversationId(conversationId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreateMessageDto, @Req() req: any): Promise<Message> {
    return this.messageService.create(dto, req.user.id);
  }
}
