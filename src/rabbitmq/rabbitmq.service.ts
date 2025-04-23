import * as amqp from 'amqplib';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange('notifications', 'topic', { durable: true });
      await this.channel.assertQueue('notification-queue', { durable: true });
      await this.channel.bindQueue('notification-queue', 'notifications', 'notification.*');
      
      this.logger.log('RabbitMQ connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error.stack);
      throw error;
    }
  }

  async publishEvent(routingKey: string, message: any) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    this.channel.publish('notifications', routingKey, Buffer.from(JSON.stringify(message)));
  }

  async consumeEvents(callback: (msg: any) => void) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    this.channel.consume('notification-queue', (msg) => {
      if (msg) {
        try {
          callback(JSON.parse(msg.content.toString()));
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing message', error);
          this.channel.nack(msg);
        }
      }
    });
  }
}