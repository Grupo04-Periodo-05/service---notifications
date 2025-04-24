// rabbitmq.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly maxRetries = 5;
  private readonly retryDelay = 5000;

  async onModuleInit() {
    await this.initializeWithRetry();
  }

  private async initializeWithRetry(retryCount = 0) {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange('notifications', 'direct', { durable: true });
      await this.channel.assertQueue('notification_queue', { durable: true });
      await this.channel.bindQueue('notification_queue', 'notifications', 'notification_key');

      this.logger.log('RabbitMQ connection and channel established');
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(`Connection failed (attempt ${retryCount + 1}), retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        await this.initializeWithRetry(retryCount + 1);
      } else {
        this.logger.error('Failed to connect to RabbitMQ after multiple attempts');
        throw error;
      }
    }
  }

  async consumeEvents(callback: (msg: any) => Promise<void>) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.consume('notification_queue', async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString());
          await callback(content);
          this.channel.ack(message);
        } catch (error) {
          this.logger.error('Error processing message:', error);
          this.channel.nack(message);
        }
      }
    });
  }

  async publishEvent(message: object) {
    if (!this.channel) {
      this.logger.error('Tentativa de publicar mensagem sem canal inicializado');
      throw new Error('RabbitMQ channel not initialized');
    }
  
    try {
      await this.channel.publish(
        'notifications',
        'notification_key',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      this.logger.error('Erro ao publicar mensagem:', error);
      await this.reconnect();
    }
  }
  
  private async reconnect() {
    try {
      if (this.connection) await this.connection.close();
      await this.initializeWithRetry();
    } catch (error) {
      this.logger.error('Falha na reconexão com RabbitMQ:', error);
    }
  }
}