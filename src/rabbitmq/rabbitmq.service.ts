import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async onModuleInit() {
    await this.connect();
  }

  async connect() {
    try {
      this.logger.log('Conectando ao RabbitMQ...');
      this.connection = await amqp.connect('amqp://rabbitmq:5672');
      this.channel = await this.connection.createChannel();
      this.logger.log('Conectado ao RabbitMQ com sucesso!');
    } catch (error) {
      this.logger.error('Erro ao conectar ao RabbitMQ', error);
      throw error;
    }
  }

  async assertQueue(queue: string) {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não está inicializado.');
    }
    await this.channel.assertQueue(queue, { durable: true });
  }

  async publish(queue: string, message: any) {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não está inicializado.');
    }
    await this.assertQueue(queue);
    const payload = Buffer.from(JSON.stringify(message));
    const ok = this.channel.sendToQueue(queue, payload);
    this.logger.log(`Mensagem publicada na fila ${queue}: ${JSON.stringify(message)}`);
    return ok;
  }

  async consume(queue: string, callback: (msg: any) => void) {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não está inicializado.');
    }
    await this.assertQueue(queue);
    this.channel.consume(
      queue,
      msg => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`Mensagem recebida na fila ${queue}: ${JSON.stringify(content)}`);
          callback(content);
          this.channel.ack(msg);
        }
      },
      { noAck: false },
    );
    this.logger.log(`Consumindo da fila ${queue}`);
  }
}
