import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  private readonly RABBITMQ_URL = process.env.RABBITMQ_URL;
  private readonly MAX_RETRIES = 10;
  private readonly RETRY_DELAY_MS = 10000;

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = this.MAX_RETRIES) {
    while (retries > 0) {
      try {
        this.connection = await amqp.connect(this.RABBITMQ_URL);
        this.channel = await this.connection.createChannel();
        return;
      } catch (error) {
        this.logger.error(`❌ Erro ao conectar ao RabbitMQ: ${error.message}`);
        retries--;

        if (retries === 0) {
          this.logger.error('❌ Número máximo de tentativas atingido. Abortando.');
          process.exit(1);
        }

        await this.delay(this.RETRY_DELAY_MS);
      }
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async assertQueue(queue: string) {
    if (!this.channel) {
      throw new Error('❌ Canal RabbitMQ não está inicializado.');
    }
    await this.channel.assertQueue(queue, { durable: true });
  }

  async publish(queue: string, message: any) {
    if (!this.channel) {
      throw new Error('❌ Canal RabbitMQ não está inicializado.');
    }
    await this.assertQueue(queue);
    const payload = Buffer.from(JSON.stringify(message));
    this.channel.sendToQueue(queue, payload);
  }

  async consume(queue: string, callback: (msg: any) => void) {
    if (!this.channel) {
      throw new Error('❌ Canal RabbitMQ não está inicializado.');
    }
    await this.assertQueue(queue);
    this.channel.consume(
      queue,
      msg => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(`❌ Erro ao processar mensagem da fila ${queue}: ${error.message}`);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false },
    );
  }
}
