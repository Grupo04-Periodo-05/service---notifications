import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ForgotPasswordEmailDto } from './dto/password-email.dto';
import { TaskReminderEmailDto } from './dto/task-email.dto';

@ApiTags('Notificações')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  @Post('email/task-reminder')
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar e-mail de tarefa vencendo' })
  @ApiResponse({ status: 201, description: 'E-mail de tarefa enviado para a fila com sucesso' })
  async sendTaskReminder(@Body() data: TaskReminderEmailDto) {
    await this.rabbitMQService.publish('notification_queue', data);
    return { message: 'E-mail de tarefa enviado para a fila com sucesso!' };
  }

  @Post('email/forgot-password')
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar e-mail de recuperação de senha' })
  @ApiResponse({ status: 201, description: 'E-mail de recuperação enviado para a fila com sucesso' })
  async sendForgotPassword(@Body() data: ForgotPasswordEmailDto) {
    await this.rabbitMQService.publish('notification_queue', data);
    return { message: 'E-mail de recuperação enviado para a fila com sucesso!' };
  }
}
