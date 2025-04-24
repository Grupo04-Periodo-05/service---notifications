import { Module, forwardRef } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [forwardRef(() => NotificationModule)], // usa forwardRef para resolver importação circular
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}
