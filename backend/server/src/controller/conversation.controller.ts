import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConversationService } from 'src/service/conversation.service.';
import { Conversation } from 'src/entities/conversation.entity';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAllByUserId(@Req() req: any): Promise<Conversation[]> {
    return this.conversationService.findAllByUserId(req.user.id);
  }
}
