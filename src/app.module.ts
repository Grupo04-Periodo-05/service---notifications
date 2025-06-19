import { Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { NotificationModule } from './notification/notification.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule, EmailModule, NotificationModule],
})
export class AppModule {}
