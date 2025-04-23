import { WebSocketGateway as NestWebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@NestWebSocketGateway({ pingTimeout: 60000,  // 1 minuto sem resposta
    pingInterval: 25000,
    cors: {
    origin: '*', // Ou especifique seu front-end (ex: 'http://localhost:3001')
    methods: ['GET', 'POST']
  },
  path: "/", // Garante que está no endpoint raiz
  transports: ['websocket']
 })
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.connectedUsers.set(userId, client);
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.connectedUsers.entries()]
      .find(([_, socket]) => socket === client)?.[0];
    if (userId) this.connectedUsers.delete(userId);
  }

  sendNotification(userId: string, notification: any): boolean {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('notification', notification);
      return true;
    }
    return false;
  }
}