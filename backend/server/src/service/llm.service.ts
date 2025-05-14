import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class LlmService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getHello() {
    const url = `${this.configService.get<string>('AI_SERVICE_URL')}/hello`;
    const response$ = this.httpService.get(url);
    const result = await lastValueFrom(response$);
    return result.data;
  }

  async getPrediction(inputData: any): Promise<any> {
    const url = `${this.configService.get<string>('AI_SERVICE_URL')}/predict`;

    const response$ = this.httpService.post(url, { input: inputData });
    const result = await lastValueFrom(response$);

    return result.data;
  }
}
