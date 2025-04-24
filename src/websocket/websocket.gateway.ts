import { WebSocketGateway as NestWebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ApiExcludeController } from '@nestjs/swagger';
import { NotificationService } from '../notification/notification.service';
import { Inject, forwardRef, Logger } from '@nestjs/common';

@ApiExcludeController()
@NestWebSocketGateway({
  pingTimeout: 60000,
  pingInterval: 25000,
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/ws/socket.io',
  transports: ['websocket'],
  logger: ['error', 'warn', 'log', 'verbose', 'debug'],
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGateway.name);
  private clients: Map<string, Socket> = new Map();

  constructor(
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.debug(`Cliente conectado: ${client.id}`);
    this.logger.debug(`userId recebido: ${userId}`);
    if (userId) {
      this.clients.set(userId, client);

      // Enviar notificações pendentes
      const pending = await this.notificationService.findPendingByUser(userId);
      this.logger.debug(`Notificações pendentes para ${userId}: ${pending.length}`);
      for (const note of pending) {
        client.emit('notification', note);
        await this.notificationService.markAsSent(note.id);
      }
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Cliente desconectado: ${client.id}`);
    for (const [userId, sock] of this.clients.entries()) {
      if (sock.id === client.id) {
        this.clients.delete(userId);
        this.logger.debug(`Removido mapping para userId ${userId}`);
        break;
      }
    }
  }

  async sendNotification(userId: string, notification: any): Promise<boolean> {
    this.logger.log(`Tentando enviar para ${userId}`);
    this.logger.debug(`Conteúdo: ${JSON.stringify(notification)}`);
    const client = this.clients.get(userId);
    if (client) {
      client.emit('notification', notification);
      this.logger.log(`Notificação enviada com sucesso para ${userId}`);
      // Atualiza status no banco
      await this.notificationService.markAsSent(notification.id);
      return true;
    } else {
      this.logger.warn(`Usuário ${userId} offline, armazenando notificação`);
      await this.notificationService.storeOfflineNotification(userId, notification);
      return false;
    }
  }

  @SubscribeMessage('register')
  async handleRegister(client: Socket, payload: { recipientId: string }) {
    this.logger.debug(`Registrando via mensagem: ${payload.recipientId}`);
    this.clients.set(payload.recipientId, client);
    const pending = await this.notificationService.findPendingByUser(payload.recipientId);
    this.logger.debug(`Notificações pendentes via register para ${payload.recipientId}: ${pending.length}`);
    for (const note of pending) {
      client.emit('notification', note);
      await this.notificationService.markAsSent(note.id);
    }
  }
}