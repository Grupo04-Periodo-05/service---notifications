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
    setTimeout(() => this.initializeConsumer(), 10000);
  }

  private async initializeConsumer() {
    await this.rabbitMQService.consume('notification_queue', async (msg) => {
      this.logger.log(`Received WebSocket notification: ${JSON.stringify(msg)}`);

      // 🔥 Cria notificação no banco
      const notification = await this.createNotificationEntry({
        type: msg.type,
        recipientId: msg.recipientId,
        content: msg.data, // Aqui você decide o que guardar como conteúdo
      });

      // 🔔 Envia via WebSocket
      const sent = await this.websocketGateway.sendNotification(
        notification.recipientId,
        notification,
      );

      if (!sent) {
        this.logger.warn(`User ${notification.recipientId} offline. Notification saved.`);
      }

      // 📧 Envia para fila de email
      if (msg.to) {
        await this.sendEmailNotification(msg);
      } else {
        this.logger.warn(`No email provided in message. Skipping email notification.`);
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

    this.logger.log(
      `Email notification published to email_queue for ${msg.to} with type ${msg.type}`,
    );
  }

  private async createNotificationEntry(createDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      ...createDto,
      status: NotificationStatus.PENDING,
    });
    return this.notificationRepository.save(notification);
  }

  async createNotification(createDto: CreateNotificationDto) {
    const notification = await this.createNotificationEntry(createDto);
    this.websocketGateway.sendNotification(notification.recipientId, notification);
    return notification;
  }

  async findPendingByUser(recipientId: string) {
    return this.notificationRepository.find({
      where: { recipientId, status: NotificationStatus.PENDING },
    });
  }

  async storeOfflineNotification(recipientId: string, data: any) {
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
    });
  }

  async markAsRead(id: string) {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    return this.notificationRepository.findOneBy({ id });
  }
}
