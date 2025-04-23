import { ApiProperty } from '@nestjs/swagger';

class NotificationContentDto {
  @ApiProperty()
  taskId: string;

  @ApiProperty()
  taskTitle: string;
}

export class CreateNotificationDto {
  @ApiProperty({ enum: ['task_assigned', 'task_updated', 'group_invite', 'chat_message'] })
  type: string;

  @ApiProperty()
  recipientId: string;

  @ApiProperty()
  content: NotificationContentDto;
}