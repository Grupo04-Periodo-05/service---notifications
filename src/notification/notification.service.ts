// notification.service.ts
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
    private readonly rabbitMQService: RabbitMQService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private websocketGateway: WebSocketGateway,
  ) {}

  async onModuleInit() {
    setTimeout(() => this.initializeMessageConsumer(), 10000);
  }

  private async initializeMessageConsumer() {
    try {
      await this.rabbitMQService.consumeEvents(async msg => {
        this.logger.log(`Received message: ${JSON.stringify(msg)}`);

        // Cria notificação no banco como PENDING
        const notification = await this.createNotificationEntry({
          type: msg.type,
          recipientId: msg.recipientId,
          content: msg.content,
        });

        // Tenta envio via WebSocket
        const sent = await this.websocketGateway.sendNotification(
          notification.recipientId,
          notification,
        );

        if (!sent) {
          this.logger.warn(`User ${notification.recipientId} offline, fallback por email`);
          setTimeout(() => this.sendEmailFallback(notification), 5 * 60 * 1000);
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ consumer', error.stack);
      setTimeout(() => this.initializeMessageConsumer(), 5000);
    }
  }

  /** Cria apenas a entry no banco, sem enviar **/
  private async createNotificationEntry(createDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      ...createDto,
      status: NotificationStatus.PENDING,
    });
    return this.notificationRepository.save(notification);
  }

  /** Cria e envia imediatamente se online **/
  async createNotification(createDto: CreateNotificationDto) {
    const notification = await this.createNotificationEntry(createDto);
    // Tenta envio em real-time
    this.websocketGateway.sendNotification(notification.recipientId, notification);
    return notification;
  }

  async findPendingByUser(recipientId: string) {
    return this.notificationRepository.find({
      where: { recipientId, status: NotificationStatus.PENDING },
    });
  }

  async storeOfflineNotification(recipientId: string, data: any) {
    this.logger.log(`Armazenando offline para ${recipientId}`);
    const notification = this.notificationRepository.create({
      recipientId,
      type: data.type || 'system_notification',
      content: data.content || {},
      status: NotificationStatus.PENDING,
    });
    await this.notificationRepository.save(notification);
  }

  async markAsSent(id: string) {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.SENT,
      createdAt: new Date(),
    });
  }

  async sendEmailFallback(notification: Notification) {
    this.logger.log(`Enviando email para ${notification.recipientId}`);
    // lógica de email aqui
    await this.notificationRepository.update(notification.id, {
      status: NotificationStatus.SENT,
    });
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
