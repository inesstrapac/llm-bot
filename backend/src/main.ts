import { NestFactory } from '@nestjs/core';
import { AppModule } from './module/llm.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
