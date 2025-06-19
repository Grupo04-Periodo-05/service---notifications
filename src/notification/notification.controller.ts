import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Notificações')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar notificação via WebSocket' })
  async sendNotification(@Body() createNotificationDto: CreateNotificationDto) {
    await this.rabbitMQService.publish('email_queue', createNotificationDto);
    return { message: 'Notificação enviada para a fila com sucesso!' };
  }

  @Post('email')
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar e-mail via RabbitMQ' })
  async sendEmail(@Body() data: {
    to: string;
    type: 'tarefa-vencendo' | 'esqueceu-senha';
    data: any;
  }) {
    await this.rabbitMQService.publish('notification_queue', data);
    return { message: 'E-mail enviado para a fila com sucesso!' };
  }
}
