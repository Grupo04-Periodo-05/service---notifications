import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EmailService } from './email.service';

@Injectable()
export class EmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.rabbitMQService.consume('email_queue', async msg => {
      this.logger.log(`Received email request: ${JSON.stringify(msg)}`);
      await this.emailService.sendEmail(
        msg.type,
        msg.to,
        msg.data,
      );
    });
  }
}
