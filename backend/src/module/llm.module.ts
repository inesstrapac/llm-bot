import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LlmController } from '../controller/llm.controller';
import { LlmService } from '../service/llm.service';

@Module({
  imports: [HttpModule],
  controllers: [LlmController],
  providers: [LlmService],
})
export class AppModule {}
