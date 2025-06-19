import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    setTimeout(() => this.initializeConsumer(), 5000);
  }

  private async initializeConsumer() {
    await this.rabbitMQService.consume('notification_queue', async (msg) => {

      if (msg.to) {
        await this.sendEmailNotification(msg);
      } else {
        this.logger.warn(`⚠️ Nenhum e-mail fornecido`);
      }
    });
  }

  private async sendEmailNotification(msg: any) {
    const emailMessage = {
      to: msg.to,
      type: msg.type,
      data: msg.data,
    };

    await this.rabbitMQService.publish('email_queue', emailMessage);

  }

  async publishNotification(msg: any) {
    await this.rabbitMQService.publish('notification_queue', msg);
  }
}
