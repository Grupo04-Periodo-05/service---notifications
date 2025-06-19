import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            
    forbidNonWhitelisted: true, 
    transform: true,            
  }));

  const config = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription('Microserviço de Notificações e E-mails')
    .setVersion('1.0')
    .addTag('notifications')
    .addTag('emails')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.getHttpAdapter().getInstance().get('/', (req, res) => {
    res.status(200).send('🟢 Notification Service is running');
  });

  await app.listen(3001);
}
bootstrap();
