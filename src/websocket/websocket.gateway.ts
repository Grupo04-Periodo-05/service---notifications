import { WebSocketGateway as NestWebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';


@ApiExcludeController()
@NestWebSocketGateway({ pingTimeout: 60000,  // 1 minuto sem resposta
    pingInterval: 25000,
    cors: {
    origin: '*', // Ou especifique seu front-end (ex: 'http://localhost:3001')
    methods: ['GET', 'POST']
  },
  path: '/ws/socket.io', // Garante que está no endpoint raiz
  transports: ['websocket']
 })

export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const logger = new Logger('WebSocketGateway');
    const userId = client.handshake.query.userId as string;
  if (userId) {
    client.join(userId);
    this.connectedUsers.set(userId, client);
  }
  console.log(`Socket ${client.id} joined room ${userId}`);

    // Log básico
    logger.log(`New connection from: ${client.id}`);
    
    // Log detalhado dos headers (modo debug)
    logger.debug('Handshake Headers:', JSON.stringify({
      origin: client.handshake.headers.origin,
      userAgent: client.handshake.headers['user-agent'],
      host: client.handshake.headers.host
    }, null, 2));
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sock] of this.connectedUsers) {
      if (sock.id === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`Socket ${client.id} left room ${userId}`);
        break;
      }
    }
  }

  sendNotification(userId: string, notification: any) {
    console.log(`Emitting notification to room ${userId}:`, notification);
    this.server.to(userId).emit('notification', notification);
    return true;
  }
}