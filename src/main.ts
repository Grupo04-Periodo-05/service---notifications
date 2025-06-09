import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // força rejeitar payloads inválidos e transformar JSON→DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // remove propriedades extras
    forbidNonWhitelisted: true, // retorna 400 se tiver campo não definido no DTO
    transform: true,            // converte payloads para instâncias de DTO
  }));

  app.useWebSocketAdapter(new IoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription('Microserviço de Notificações')
    .setVersion('1.0')
    .addTag('notifications')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();
