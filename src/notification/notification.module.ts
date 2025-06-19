import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    RabbitMQModule,
    forwardRef(() => WebSocketModule),
  ],
  providers: [NotificationService, RabbitMQModule],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
