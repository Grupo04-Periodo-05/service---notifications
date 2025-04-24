import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';  
import { WebSocketModule } from '../websocket/websocket.module';
import { WebSocketGateway } from '../websocket/websocket.gateway'; 

@Module({
  imports: [TypeOrmModule.forFeature([Notification]),
  RabbitMQModule,  // Adicione esta linha
  WebSocketModule,],
  providers: [NotificationService, WebSocketGateway],
  controllers: [NotificationController],
})
export class NotificationModule {}