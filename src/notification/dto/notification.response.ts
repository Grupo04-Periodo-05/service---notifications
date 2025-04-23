import { ApiProperty } from '@nestjs/swagger';

class NotificationContentResponse {
  @ApiProperty({ example: 'task_456' })
  taskId: string;

  @ApiProperty({ example: 'Implement API Endpoints' })
  taskTitle: string;
}

export class NotificationResponse {
  @ApiProperty({ example: '714b92a7-c90c-4cf2-b920-f1d92326fb87' })
  id: string;

  @ApiProperty({ example: 'task_assigned' })
  type: string;

  @ApiProperty({ example: 'user_123' })
  recipientId: string;

  @ApiProperty()
  content: NotificationContentResponse;

  @ApiProperty({ enum: ['unread', 'read', 'archived'] })
  status: string;

  @ApiProperty({ example: '2025-04-23T17:33:22.409Z' })
  createdAt: Date;

  @ApiProperty({ example: null })
  readAt: Date | null;
}