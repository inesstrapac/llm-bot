import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class LlmService {
  constructor(private readonly httpService: HttpService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getPrediction(inputData: any): Promise<any> {
    // Replace 'localhost' and '8000' with your actual Python service URL/port
    const url = 'http://localhost:5000/predict';

    // Make POST request to the Python microservice
    const response$ = this.httpService.post(url, { input: inputData });
    const response = await lastValueFrom(response$);

    // Return the AI response
    return response.data;
  }
}
