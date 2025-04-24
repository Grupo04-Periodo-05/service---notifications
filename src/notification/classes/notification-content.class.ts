import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NotificationContent {
  @ApiProperty()
  @IsString()
  taskId: string;

  @ApiProperty()
  @IsString()
  taskTitle: string;

  constructor(data?: Partial<NotificationContent>) {
    if (data) {
      this.taskId = data.taskId || '';
      this.taskTitle = data.taskTitle || '';
    }
  }
}