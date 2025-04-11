import { Body, Controller, Get, Post } from '@nestjs/common';
import { LlmService } from '../service/llm.service';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get()
  getHello(): string {
    return this.llmService.getHello();
  }

  @Post('predict')
  async getPrediction(@Body() body: any) {
    return await this.llmService.getPrediction(body.input);
  }
}
