// src/notification/dto/create-notification.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationContent } from '../classes/notification-content.class';
import { NotificationStatus } from '../enums/notification-status.enum';

export class CreateNotificationDto {
  @ApiProperty({ enum: ['task_assigned', 'task_updated', 'group_invite', 'chat_message'] })
  @IsEnum(['task_assigned', 'task_updated', 'group_invite', 'chat_message'] as const)
  type: 'task_assigned' | 'task_updated' | 'group_invite' | 'chat_message';

  @ApiProperty()
  @IsString()
  recipientId: string;

  @ApiProperty({ type: () => NotificationContent })
  @ValidateNested()
  @Type(() => NotificationContent)
  content: NotificationContent;

  @ApiProperty({ enum: NotificationStatus, required: false })
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}