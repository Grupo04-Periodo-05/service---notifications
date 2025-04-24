import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationStatus } from './enums/notification-status.enum';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly rabbitMQService: RabbitMQService,
    private websocketGateway: WebSocketGateway,
  ) {}

  async onModuleInit() {
    await this.initializeMessageConsumer();
  }

  private async initializeMessageConsumer() {
    try {
      this.rabbitMQService.consumeEvents(async (msg) => {
        try {
          this.logger.log(`Received message: ${JSON.stringify(msg)}`);
          
          const notification = await this.createNotification({
            type: msg.type,
            recipientId: msg.recipientId,
            content: msg.content
          });

          const sent = this.websocketGateway.sendNotification(
            notification.recipientId, 
            notification
          );

          if (!sent) {
            this.logger.warn(`User ${notification.recipientId} offline, scheduling email fallback`);
            setTimeout(async () => {
              await this.sendEmailFallback(notification);
            }, 5 * 60 * 1000);
          }
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`, error.stack);
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ consumer', error.stack);
      throw error;
    }
  }

  async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create({
        type: createDto.type,
        recipientId: createDto.recipientId,
        content: createDto.content,
        status: NotificationStatus.UNREAD
      });

      const savedNotification = await this.notificationRepository.save(notification);
      this.logger.log(`Notification created: ${savedNotification.id}`);
      const sent = this.websocketGateway.sendNotification(
        savedNotification.recipientId,
        savedNotification,
      );
      this.logger.log(`WebSocket sendNotification returned: ${sent}`);
      return savedNotification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id },
      });

      if (!notification) {
        throw new Error(`Notification with ID ${id} not found`);
      }

      return notification;
    } catch (error) {
      this.logger.error(`Failed to find notification: ${error.message}`);
      throw error;
    }
  }

  async sendEmailFallback(notification: Notification): Promise<void> {
    try {
      // Implement your email sending logic here
      this.logger.log(`Sending email to ${notification.recipientId}`);
      
      await this.notificationRepository.update(notification.id, {
        status: NotificationStatus.SENT
      });
    } catch (error) {
      this.logger.error(`Failed to send email fallback: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      await this.notificationRepository.update(id, { 
        status: NotificationStatus.READ,
        readAt: new Date()
      });

      const updatedNotification = await this.notificationRepository.findOneBy({ id });
      if (!updatedNotification) {
        throw new Error(`Notification with ID ${id} not found after update`);
      }

      return updatedNotification;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      throw error;
    }
  }
}