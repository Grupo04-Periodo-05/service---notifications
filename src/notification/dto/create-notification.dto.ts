import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationContentDto {
  @ApiProperty()
  @IsString()
  taskId: string;

  @ApiProperty()
  @IsString()
  taskTitle: string;
}

export class CreateNotificationDto {
  @ApiProperty({ enum: ['task_assigned', 'task_updated', 'group_invite', 'chat_message'] })
  @IsEnum(['task_assigned', 'task_updated', 'group_invite', 'chat_message'] as const)
  type: 'task_assigned' | 'task_updated' | 'group_invite' | 'chat_message';

  @ApiProperty()
  @IsString()
  recipientId: string;

  @ApiProperty({ type: () => NotificationContentDto })
  @ValidateNested()
  @Type(() => NotificationContentDto)
  content: NotificationContentDto;
}
